using System.Globalization;
using System.Security.Claims;
using BrikkhoRongon.Api.Auth;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using BrikkhoRongon.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

// ---- What the browser sends ----
public record LineRequest(string Slug, int Qty);
public record CustomerRequest(string Name, string Phone, string? Email, string District, string Area, string Address);
public record DeliveryRequest(string Date, string Slot);
// Note: there is deliberately no price, discount or total here. The server works those out itself.
public record CreateOrderRequest(LineRequest[] Lines, string? Coupon, CustomerRequest Customer, DeliveryRequest Delivery,
    string Payment, string GiftCard, string? GiftNote, string? Note);
public record ModRequestInput(RequestType Type, string? Detail, string? Value);
public record ResolveInput(RequestStatus Status);
public record LookupRequest(string[] Ids);

// ---- What the server returns (same shape as the storefront's `Order` type) ----
public record OrderLineDto(string Slug, string Name, string Image, decimal Price, int Qty);
public record CustomerDto(string Name, string Phone, string Email, string District, string Area, string Address);
public record DeliveryDto(string Date, string Slot);
public record HistoryDto(OrderStatus Status, DateTime At);
public record ModRequestDto(string Id, RequestType Type, string Detail, string? Value, RequestStatus Status, DateTime At);
public record OrderDto(string Id, DateTime CreatedAt, OrderLineDto[] Lines, decimal Subtotal, decimal? Discount, string? Coupon,
    decimal Shipping, decimal Total, CustomerDto Customer, DeliveryDto Delivery, string Payment, string GiftCard,
    string GiftNote, string Note, OrderStatus Status, HistoryDto[] History, ModRequestDto[] Requests,
    string PaymentStatus, string? CancelReason);
public record OrderNoteDto(int Id, string Text, string Author, DateTime At);
/// <summary>What the admin's order page needs: the order, the team's private notes, and how this customer has behaved so far.</summary>
public record AdminOrderDetail(OrderDto Order, OrderNoteDto[] Notes, int CustomerOrders, decimal CustomerSpent);
public record PaymentInput(string Status);
public record NoteInput(string? Text);
public record CancelInput(string? Reason);

public static class OrderEndpoints
{
    private const int MaxLines = 30, MaxQty = 20, MaxRequests = 10;

    public static void MapOrders(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/orders").WithTags("Orders").RequireRateLimiting("orders");

        // Checkout. Works for guests and signed-in customers (a valid token just links the order to the account).
        g.MapPost("/", async Task<IResult> (CreateOrderRequest? r, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var settings = await db.GetSettingsAsync(ct);
            var errors = ValidateCreate(r, settings.SlotList());
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            r = r!;

            // Merge duplicate lines, then price everything from OUR catalog. Hidden plants can't be bought.
            var wanted = r.Lines.GroupBy(l => l.Slug).ToDictionary(x => x.Key, x => Math.Min(x.Sum(l => l.Qty), MaxQty));
            var slugs = wanted.Keys.ToList();
            var products = await db.Products.AsNoTracking().Where(p => slugs.Contains(p.Slug) && !p.Hidden).ToListAsync(ct);
            if (products.Count != wanted.Count)
                return Problem(StatusCodes.Status400BadRequest, "UNKNOWN_PRODUCT", "One of the plants in your cart is no longer available.");

            // Friendly early check; the real, race-proof check happens again inside the transaction below.
            if (products.FirstOrDefault(p => p.Stock is { } s && s < wanted[p.Slug]) is { } short1)
                return OutOfStock(short1);

            var code = r.Coupon?.Trim().ToUpperInvariant();
            PromoCode? promo = string.IsNullOrEmpty(code) ? null : await db.PromoCodes.AsNoTracking().FirstOrDefaultAsync(c => c.Code == code && c.Active, ct);
            var subtotal = products.Sum(p => p.Price * wanted[p.Slug]);
            var totals = Pricing.Compute(subtotal, r.Coupon, r.Customer.District, r.Customer.Area,
                coupons: promo is null ? Array.Empty<Coupon>() : new[] { promo.ToCoupon() }, rules: settings.Rules());
            if (totals.CouponProblem is not null)
                return Problem(StatusCodes.Status400BadRequest, totals.CouponProblem, "This coupon can't be applied to your order.");

            var id = OrderIds.New();
            while (await db.Orders.AnyAsync(o => o.Id == id, ct)) id = OrderIds.New();

            // Stock and the coupon counter change together with the order, or not at all.
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            foreach (var p in products.Where(p => p.Stock is not null))
            {
                var pid = p.Id; var qty = wanted[p.Slug];
                var changed = await db.Products.Where(x => x.Id == pid && x.Stock >= qty)
                    .ExecuteUpdateAsync(u => u.SetProperty(x => x.Stock, x => x.Stock - qty), ct);
                if (changed == 0) return OutOfStock(p); // someone else bought the last one a moment ago
            }
            if (promo is not null)
            {
                var changed = await db.PromoCodes.Where(c => c.Code == promo.Code && (c.UsageLimit == null || c.Used < c.UsageLimit))
                    .ExecuteUpdateAsync(u => u.SetProperty(c => c.Used, c => c.Used + 1), ct);
                if (changed == 0) return Problem(StatusCodes.Status400BadRequest, "COUPON_USED_UP", "This coupon can't be applied to your order.");
            }

            var now = DateTime.UtcNow;
            var order = new Order
            {
                Id = id,
                UserId = principal.FindFirstValue("sub"),
                CreatedAt = now,
                Subtotal = totals.Subtotal,
                Discount = totals.Discount,
                CouponCode = totals.CouponCode,
                Shipping = totals.Shipping,
                Total = totals.Total,
                CustomerName = r.Customer.Name.Trim(),
                Phone = r.Customer.Phone.Trim(),
                Email = r.Customer.Email?.Trim() ?? "",
                District = r.Customer.District,
                Area = r.Customer.Area.Trim(),
                Address = r.Customer.Address.Trim(),
                DeliveryDate = r.Delivery.Date,
                Slot = r.Delivery.Slot,
                Payment = r.Payment,
                GiftCard = r.GiftCard,
                GiftNote = r.GiftNote?.Trim() ?? "",
                Note = r.Note?.Trim() ?? "",
                Lines = [.. products.OrderBy(p => p.Id).Select(p => new OrderLine
                {
                    OrderId = id, Slug = p.Slug, Name = p.NameEn, ImageSrc = p.ImageSrc, UnitPrice = p.Price, Qty = wanted[p.Slug],
                })],
                History = [new OrderEvent { OrderId = id, Status = OrderStatus.Ordered, At = now }],
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Results.Ok(ToDto(order));
        });

        // Tracking. The long random order number is the guest's key, which is why lookups are rate limited.
        g.MapGet("/{id}", async Task<IResult> (string id, AppDbContext db, CancellationToken ct) =>
            await Load(db, id.Trim().ToUpperInvariant(), ct) is { } order ? Results.Ok(ToDto(order)) : Results.NotFound());

        // "My recent orders" on this device: the browser remembers its order numbers and asks for them in one go.
        g.MapPost("/lookup", async Task<IResult> (LookupRequest? r, AppDbContext db, CancellationToken ct) =>
        {
            var ids = (r?.Ids ?? []).Select(x => x?.Trim().ToUpperInvariant() ?? "").Where(x => x.Length is > 3 and <= 20).Distinct().Take(20).ToList();
            var orders = await Everything(db).AsNoTracking().Where(o => ids.Contains(o.Id)).OrderByDescending(o => o.CreatedAt).ToListAsync(ct);
            return Results.Ok(orders.Select(ToDto));
        });

        // A customer asks for a change (different pot, new date...). Only possible before the order ships.
        g.MapPost("/{id}/requests", async Task<IResult> (string id, ModRequestInput? r, AppDbContext db, CancellationToken ct) =>
        {
            var order = await Everything(db).FirstOrDefaultAsync(o => o.Id == id.Trim().ToUpperInvariant(), ct);
            if (order is null) return Results.NotFound();
            if (r is null) return Results.ValidationProblem(new Dictionary<string, string[]> { ["request"] = ["Missing request."] });
            if (order.Status is not (OrderStatus.Ordered or OrderStatus.Packed))
                return Problem(StatusCodes.Status409Conflict, "NOT_MODIFIABLE", "This order has already left us, so it can't be changed.");
            if (order.Requests.Count >= MaxRequests)
                return Problem(StatusCodes.Status400BadRequest, "TOO_MANY_REQUESTS", "Too many change requests on this order.");

            var detail = r.Detail?.Trim() ?? "";
            var value = r.Value?.Trim();
            var bad = r.Type switch
            {
                RequestType.Pot => value is null || !Pricing.Pots.Contains(value),
                RequestType.GiftNote => string.IsNullOrEmpty(value) || value.Length > 200,
                RequestType.Date => !IsDeliveryDate(value) || value == order.DeliveryDate,
                RequestType.Custom => detail.Length is < 5 or > 300,
                _ => true,
            };
            if (bad) return Results.ValidationProblem(new Dictionary<string, string[]> { ["request"] = ["That request isn't valid."] });

            order.Requests.Add(new ModRequest { Id = OrderIds.New("REQ-", 6), OrderId = order.Id, Type = r.Type, Detail = detail, Value = value });
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(order));
        });

        // Signed-in customers: all orders on their account.
        app.MapGroup("/api/me/orders").WithTags("Account").RequireAuthorization()
            .MapGet("/", async Task<IResult> (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
            {
                var userId = principal.FindFirstValue("sub");
                var orders = await Everything(db).AsNoTracking().Where(o => o.UserId == userId).OrderByDescending(o => o.CreatedAt).ToListAsync(ct);
                return Results.Ok(orders.Select(ToDto));
            });

        // The shop team's side. Moving orders along is open to delivery staff too; cancelling and refunding needs Owner or Manager.
        var fulfil = app.MapGroup("/api/admin/orders").WithTags("Admin").RequireAuthorization(Policies.Fulfil);
        var manage = app.MapGroup("/api/admin/orders").WithTags("Admin").RequireAuthorization(Policies.Write);

        fulfil.MapPost("/{id}/advance", async Task<IResult> (string id, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var order = await Everything(db).FirstOrDefaultAsync(o => o.Id == id.ToUpperInvariant(), ct);
            if (order is null) return Results.NotFound();
            if (order.Status < OrderStatus.Delivered)
            {
                order.Status++;
                order.History.Add(new OrderEvent { OrderId = order.Id, Status = order.Status });
                // Cash on delivery: the money is collected when the parcel is handed over.
                if (order.Status == OrderStatus.Delivered && order.Payment == "cod" && order.PaymentStatus != "refunded") order.PaymentStatus = "paid";
                if (AdminSupport.KindFor(order.Status) is { } kind) db.Notify(order, kind);
                db.Audit(who, "order.advance", "order", order.Id, $"-> {order.Status}");
                await db.SaveChangesAsync(ct);
            }
            return Results.Ok(await DetailAsync(db, order.Id, ct));
        });

        fulfil.MapPost("/{id}/payment", async Task<IResult> (string id, PaymentInput? r, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var order = await Everything(db).FirstOrDefaultAsync(o => o.Id == id.ToUpperInvariant(), ct);
            if (order is null) return Results.NotFound();
            if (r?.Status is not ("paid" or "unpaid")) return AdminSupport.Invalid("status", "Use paid or unpaid.");
            if (order.PaymentStatus == "refunded") return Problem(StatusCodes.Status409Conflict, "ALREADY_REFUNDED", "This order has already been refunded.");
            order.PaymentStatus = r.Status;
            db.Audit(who, "order.payment", "order", order.Id, r.Status);
            await db.SaveChangesAsync(ct);
            return Results.Ok(await DetailAsync(db, order.Id, ct));
        });

        fulfil.MapPost("/{id}/notes", async Task<IResult> (string id, NoteInput? r, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var orderId = id.ToUpperInvariant();
            if (!await db.Orders.AnyAsync(o => o.Id == orderId, ct)) return Results.NotFound();
            var text = r?.Text?.Trim();
            if (string.IsNullOrEmpty(text) || text.Length > 500) return AdminSupport.Invalid("text", "Write a note (1–500 characters).");
            db.OrderNotes.Add(new OrderNote { OrderId = orderId, Text = text, Author = who.FindFirstValue("name") ?? who.FindFirstValue("email") ?? "Staff" });
            db.Audit(who, "order.note", "order", orderId);
            await db.SaveChangesAsync(ct);
            return Results.Ok(await DetailAsync(db, orderId, ct));
        });

        manage.MapPost("/{id}/requests/{requestId}/resolve", async Task<IResult> (string id, string requestId, ResolveInput? r, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var order = await Everything(db).FirstOrDefaultAsync(o => o.Id == id.ToUpperInvariant(), ct);
            var request = order?.Requests.FirstOrDefault(x => x.Id == requestId);
            if (order is null || request is null) return Results.NotFound();
            if (r?.Status is not (RequestStatus.Approved or RequestStatus.Declined))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Use approved or declined."] });

            if (request.Status == RequestStatus.Pending)
            {
                request.Status = r.Status;
                if (r.Status == RequestStatus.Approved && request.Value is { Length: > 0 })
                {
                    if (request.Type == RequestType.Date) order.DeliveryDate = request.Value;
                    if (request.Type == RequestType.GiftNote) order.GiftNote = request.Value;
                }
                db.Notify(order, r.Status == RequestStatus.Approved ? "request.approved" : "request.declined");
                db.Audit(who, "order.request", "order", order.Id, $"{request.Type} {r.Status}");
                await db.SaveChangesAsync(ct);
            }
            return Results.Ok(await DetailAsync(db, order.Id, ct));
        });

        // Cancel: only before the parcel leaves. The plants go back on the shelf and a used coupon is given back.
        manage.MapPost("/{id}/cancel", async Task<IResult> (string id, CancelInput? r, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var order = await Everything(db).FirstOrDefaultAsync(o => o.Id == id.ToUpperInvariant(), ct);
            if (order is null) return Results.NotFound();
            if (order.Status is not (OrderStatus.Ordered or OrderStatus.Packed))
                return Problem(StatusCodes.Status409Conflict, "NOT_CANCELLABLE", "Only orders that haven't shipped can be cancelled.");
            var reason = r?.Reason?.Trim();
            if (reason?.Length > 200) return AdminSupport.Invalid("reason", "The reason is too long.");

            await using var tx = await db.Database.BeginTransactionAsync(ct);
            foreach (var l in order.Lines)
            {
                var slug = l.Slug; var qty = l.Qty;
                await db.Products.Where(p => p.Slug == slug && p.Stock != null)
                    .ExecuteUpdateAsync(u => u.SetProperty(p => p.Stock, p => p.Stock + qty), ct);
            }
            if (order.CouponCode is { } code)
                await db.PromoCodes.Where(c => c.Code == code && c.Used > 0).ExecuteUpdateAsync(u => u.SetProperty(c => c.Used, c => c.Used - 1), ct);

            order.Status = OrderStatus.Cancelled;
            order.CancelReason = string.IsNullOrEmpty(reason) ? null : reason;
            order.History.Add(new OrderEvent { OrderId = order.Id, Status = OrderStatus.Cancelled });
            db.Notify(order, "order.cancelled");
            db.Audit(who, "order.cancel", "order", order.Id, reason);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Results.Ok(await DetailAsync(db, order.Id, ct));
        });

        // Refund is a bookkeeping step: it records that the money was sent back (the actual transfer happens outside this system).
        manage.MapPost("/{id}/refund", async Task<IResult> (string id, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var order = await Everything(db).FirstOrDefaultAsync(o => o.Id == id.ToUpperInvariant(), ct);
            if (order is null) return Results.NotFound();
            if (order.PaymentStatus != "paid" || order.Status is not (OrderStatus.Cancelled or OrderStatus.Delivered))
                return Problem(StatusCodes.Status409Conflict, "NOT_REFUNDABLE", "Only paid orders that are cancelled or delivered can be refunded.");
            order.PaymentStatus = "refunded";
            db.Notify(order, "order.refunded");
            db.Audit(who, "order.refund", "order", order.Id, $"৳{order.Total}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(await DetailAsync(db, order.Id, ct));
        });
    }

    // ---------- helpers ----------

    internal static IQueryable<Order> Everything(AppDbContext db) =>
        db.Orders.Include(o => o.Lines).Include(o => o.History).Include(o => o.Requests).AsSplitQuery();

    private static Task<Order?> Load(AppDbContext db, string id, CancellationToken ct) =>
        Everything(db).AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct);

    internal static async Task<AdminOrderDetail?> DetailAsync(AppDbContext db, string id, CancellationToken ct)
    {
        var order = await Everything(db).Include(o => o.Notes).AsNoTracking().AsSplitQuery().FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order is null) return null;
        IQueryable<Order> mine = db.Orders.AsNoTracking().Where(o => o.Status != OrderStatus.Cancelled);
        mine = order.UserId is { } uid ? mine.Where(o => o.UserId == uid) : mine.Where(o => o.UserId == null && o.Phone == order.Phone);
        return new AdminOrderDetail(ToDto(order),
            [.. order.Notes.OrderByDescending(n => n.At).Select(n => new OrderNoteDto(n.Id, n.Text, n.Author, n.At))],
            await mine.CountAsync(ct), await mine.SumAsync(o => (decimal?)o.Total, ct) ?? 0);
    }

    private static IResult OutOfStock(Product p) =>
        Results.Problem(statusCode: StatusCodes.Status409Conflict, title: $"{p.NameEn} is out of stock.",
            extensions: new Dictionary<string, object?> { ["code"] = "OUT_OF_STOCK", ["slug"] = p.Slug });

    private static IResult Problem(int status, string code, string title) =>
        Results.Problem(statusCode: status, title: title, extensions: new Dictionary<string, object?> { ["code"] = code });

    /// <summary>Delivery days run from today to a week ahead, counted in Bangladesh time (UTC+6), plus a day of slack for other timezones.</summary>
    private static bool IsDeliveryDate(string? value)
    {
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day)) return false;
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6));
        return day >= today && day <= today.AddDays(8);
    }

    private static Dictionary<string, string[]> ValidateCreate(CreateOrderRequest? r, string[] slots)
    {
        var e = new Dictionary<string, string[]>();
        if (r?.Lines is null || r.Customer is null || r.Delivery is null)
        {
            e["order"] = ["The order is incomplete."];
            return e;
        }
        if (r.Lines.Length is 0 or > MaxLines || r.Lines.Any(l => l is null || string.IsNullOrWhiteSpace(l.Slug) || l.Slug.Length > 100 || l.Qty is < 1 or > MaxQty))
            e["lines"] = [$"Add 1–{MaxLines} plants, each with a quantity of 1–{MaxQty}."];

        var c = r.Customer;
        if (c.Name is null || c.Name.Trim().Length is < 2 or > 80) e["customer.name"] = ["Enter your name."];
        if (c.Phone is null || !System.Text.RegularExpressions.Regex.IsMatch(c.Phone.Trim(), @"^(?:\+?88)?01[3-9]\d{8}$")) e["customer.phone"] = ["Enter a valid Bangladeshi mobile number."];
        if (!string.IsNullOrWhiteSpace(c.Email) && !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(c.Email.Trim())) e["customer.email"] = ["Enter a valid email address."];
        if (c.District is null || !Pricing.Districts.Contains(c.District)) e["customer.district"] = ["Choose a district."];
        if (c.Area is null || c.Area.Trim().Length is < 2 or > 100) e["customer.area"] = ["Enter the area."];
        if (c.Address is null || c.Address.Trim().Length is < 5 or > 200) e["customer.address"] = ["Enter the full address."];

        if (!IsDeliveryDate(r.Delivery.Date)) e["delivery.date"] = ["Choose a delivery date from the list."];
        if (r.Delivery.Slot is null || !slots.Contains(r.Delivery.Slot)) e["delivery.slot"] = ["Choose a delivery slot."];
        if (r.Payment is null || !Pricing.Payments.Contains(r.Payment)) e["payment"] = ["Choose a payment method."];
        if (r.GiftCard is null || !Pricing.GiftCards.Contains(r.GiftCard)) e["giftCard"] = ["Choose a gift card."];
        if (r.GiftNote?.Length > 200) e["giftNote"] = ["The gift note is too long."];
        if (r.Note?.Length > 300) e["note"] = ["The note is too long."];
        if (r.Coupon?.Length > 30) e["coupon"] = ["That coupon code is too long."];
        return e;
    }

    internal static OrderDto ToDto(Order o) => new(
        o.Id, o.CreatedAt,
        [.. o.Lines.OrderBy(l => l.Id).Select(l => new OrderLineDto(l.Slug, l.Name, l.ImageSrc, l.UnitPrice, l.Qty))],
        o.Subtotal,
        o.CouponCode is null ? null : o.Discount,
        o.CouponCode,
        o.Shipping, o.Total,
        new CustomerDto(o.CustomerName, o.Phone, o.Email, o.District, o.Area, o.Address),
        new DeliveryDto(o.DeliveryDate, o.Slot),
        o.Payment, o.GiftCard, o.GiftNote, o.Note, o.Status,
        [.. o.History.OrderBy(h => h.At).Select(h => new HistoryDto(h.Status, h.At))],
        [.. o.Requests.OrderByDescending(x => x.At).Select(x => new ModRequestDto(x.Id, x.Type, x.Detail, x.Value, x.Status, x.At))],
        string.IsNullOrEmpty(o.PaymentStatus) ? "unpaid" : o.PaymentStatus, o.CancelReason);
}
