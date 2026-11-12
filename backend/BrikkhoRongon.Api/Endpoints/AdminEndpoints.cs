using System.Security.Claims;
using System.Text.RegularExpressions;
using BrikkhoRongon.Api.Auth;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using BrikkhoRongon.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

public record DayStat(string Date, int Orders, decimal Value);
public record TopPlant(string Slug, string Name, int Qty, decimal Value);
public record AdminStats(
    int OrderCount, decimal OrderValue, int PendingRequests, int NeedsAction,
    Dictionary<string, int> ByStatus, DayStat[] Last7Days, TopPlant[] TopPlants);
public record AdminOrdersPage(OrderDto[] Items, int Total, int Page, int PageSize);

public record CategorySale(string Category, int Qty, decimal Revenue);
public record LowStockItem(int Id, string Slug, string Name, int Stock, string Image);
public record Analytics(int Days, decimal Revenue, int Orders, decimal AverageOrder, int NewCustomers, int ReturningCustomers,
    int NewCustomerOrders, int ReturningCustomerOrders, DayStat[] Series, CategorySale[] Categories, TopPlant[] TopPlants,
    LowStockItem[] LowStock, int OutOfStock, int LowStockAt);

public record CustomerDto(string Id, string Name, string Email, string Phone, DateTime CreatedAt, bool Locked, string[] Roles,
    int OrderCount, decimal TotalSpent, DateTime? LastOrderAt);
public record CustomerDetail(CustomerDto Customer, OrderDto[] Orders, AddressDto[] Addresses);
public record CustomersPage(CustomerDto[] Items, int Total, int Page, int PageSize);
public record LockInput(bool Locked);

public record CouponDto(string Code, string Kind, int Value, int MinSubtotal, DateTime? ExpiresAt, int? UsageLimit, int Used, bool Active, DateTime CreatedAt);
public record CouponInput(string? Code, string Kind, int Value, int MinSubtotal, DateTime? ExpiresAt, int? UsageLimit, bool Active);

public record SettingsDto(decimal FreeShippingThreshold, decimal DhakaInnerFee, decimal DhakaOuterFee, Dictionary<string, decimal> DistrictFees,
    string[] Slots, int LowStockAt, string ShopName, string Phone, string Email, string Address);

public record AdminReviewDto(string Id, string Slug, string Name, int Rating, string Title, string Text, DateTime At, bool Verified, bool Hidden);
public record AdminReviewsPage(AdminReviewDto[] Items, int Total, int Page, int PageSize);

public record AuditDto(long Id, DateTime At, string Actor, string Action, string Entity, string? EntityId, string? Detail);
public record AuditPage(AuditDto[] Items, int Total, int Page, int PageSize);

public record StaffDto(string Id, string Name, string Email, string Role, DateTime CreatedAt);
public record StaffInput(string? Email, string? Role);

/// <summary>Numbers, lists and settings for the /admin area. Each group says which role may use it (see Auth/Policies.cs).</summary>
public static partial class AdminEndpoints
{
    [GeneratedRegex("^[A-Z0-9]{3,30}$")]
    private static partial Regex CodeRx();

    public static void MapAdmin(this IEndpointRouteBuilder app)
    {
        var read = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization(Policies.Read);
        var write = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization(Policies.Write);
        var owner = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization(Policies.Owner);
        var orders = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization(Policies.Orders);

        // ---------- dashboard ----------
        read.MapGet("/stats", async Task<IResult> (AppDbContext db, CancellationToken ct) =>
        {
            var live = db.Orders.Where(o => o.Status != OrderStatus.Cancelled);
            var byStatus = await db.Orders.GroupBy(o => o.Status).Select(x => new { Status = x.Key, Count = x.Count() }).ToListAsync(ct);
            var counts = Enum.GetValues<OrderStatus>().ToDictionary(s => AdminSupport.ToCamel(s.ToString()), s => byStatus.FirstOrDefault(x => x.Status == s)?.Count ?? 0);

            // "Today" is a Bangladesh day (UTC+6): that is when the shop actually opens and closes.
            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6));
            var from = AdminSupport.DayStartUtc(today.AddDays(-6).ToString("yyyy-MM-dd"))!.Value;
            var recent = await live.AsNoTracking().Where(o => o.CreatedAt >= from).Select(o => new { o.CreatedAt, o.Total }).ToListAsync(ct);
            var days = Enumerable.Range(0, 7).Select(i => today.AddDays(i - 6)).Select(d =>
            {
                var rows = recent.Where(o => DateOnly.FromDateTime(o.CreatedAt.AddHours(6)) == d).ToList();
                return new DayStat(d.ToString("yyyy-MM-dd"), rows.Count, rows.Sum(o => o.Total));
            }).ToArray();

            var topRows = await db.OrderLines.Where(l => db.Orders.Any(o => o.Id == l.OrderId && o.Status != OrderStatus.Cancelled))
                .GroupBy(l => new { l.Slug, l.Name })
                .Select(x => new { x.Key.Slug, x.Key.Name, Qty = x.Sum(l => l.Qty), Value = x.Sum(l => l.Qty * l.UnitPrice) })
                .OrderByDescending(x => x.Qty).Take(5).ToListAsync(ct);

            return Results.Ok(new AdminStats(
                OrderCount: await live.CountAsync(ct),
                OrderValue: await live.SumAsync(o => (decimal?)o.Total, ct) ?? 0,
                PendingRequests: await db.Orders.Where(o => o.Status != OrderStatus.Cancelled).SelectMany(o => o.Requests).CountAsync(r => r.Status == RequestStatus.Pending, ct),
                NeedsAction: await db.Orders.CountAsync(o => o.Status != OrderStatus.Delivered && o.Status != OrderStatus.Cancelled, ct),
                ByStatus: counts, Last7Days: days, TopPlants: [.. topRows.Select(x => new TopPlant(x.Slug, x.Name, x.Qty, x.Value))]));
        });

        // GET /api/admin/analytics?days=30
        read.MapGet("/analytics", async Task<IResult> (AppDbContext db, int? days, CancellationToken ct) =>
        {
            var n = days is 7 or 30 or 90 ? days.Value : 30;
            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6));
            var first = today.AddDays(-(n - 1));
            var from = AdminSupport.DayStartUtc(first.ToString("yyyy-MM-dd"))!.Value;

            var rows = await db.Orders.AsNoTracking().Where(o => o.CreatedAt >= from && o.Status != OrderStatus.Cancelled)
                .Select(o => new { o.CreatedAt, o.Total, Key = o.UserId ?? o.Phone }).ToListAsync(ct);
            var series = Enumerable.Range(0, n).Select(i => first.AddDays(i)).Select(d =>
            {
                var r = rows.Where(o => DateOnly.FromDateTime(o.CreatedAt.AddHours(6)) == d).ToList();
                return new DayStat(d.ToString("yyyy-MM-dd"), r.Count, r.Sum(o => o.Total));
            }).ToArray();

            // A customer is "returning" if they had an order before this period started. Guests are matched by phone number.
            var keys = rows.Select(r => r.Key).Distinct().ToList();
            var before = (await db.Orders.AsNoTracking().Where(o => o.CreatedAt < from && o.Status != OrderStatus.Cancelled && keys.Contains(o.UserId ?? o.Phone))
                .Select(o => o.UserId ?? o.Phone).Distinct().ToListAsync(ct)).ToHashSet();
            var returning = rows.Where(r => before.Contains(r.Key)).ToList();

            var lines = await db.OrderLines.AsNoTracking()
                .Where(l => db.Orders.Any(o => o.Id == l.OrderId && o.CreatedAt >= from && o.Status != OrderStatus.Cancelled))
                .Select(l => new { l.Slug, l.Name, l.Qty, l.UnitPrice }).ToListAsync(ct);
            var cat = await db.Products.AsNoTracking().Select(p => new { p.Slug, p.Category }).ToDictionaryAsync(p => p.Slug, p => p.Category, ct);
            var categories = lines.GroupBy(l => cat.TryGetValue(l.Slug, out var c) ? AdminSupport.ToCamel(c.ToString()) : "removed")
                .Select(g => new CategorySale(g.Key, g.Sum(l => l.Qty), g.Sum(l => l.Qty * l.UnitPrice))).OrderByDescending(c => c.Revenue).ToArray();
            var top = lines.GroupBy(l => new { l.Slug, l.Name }).Select(g => new TopPlant(g.Key.Slug, g.Key.Name, g.Sum(l => l.Qty), g.Sum(l => l.Qty * l.UnitPrice)))
                .OrderByDescending(t => t.Qty).Take(5).ToArray();

            var low = (await db.GetSettingsAsync(ct)).LowStockAt;
            var lowRows = await db.Products.AsNoTracking().Where(p => !p.Hidden && p.Stock != null && p.Stock <= low).OrderBy(p => p.Stock).ThenBy(p => p.Id).Take(30)
                .Select(p => new LowStockItem(p.Id, p.Slug, p.NameEn, p.Stock ?? 0, p.ImageSrc)).ToArrayAsync(ct);
            var out0 = await db.Products.CountAsync(p => !p.Hidden && p.Stock != null && p.Stock <= 0, ct);

            var revenue = rows.Sum(r => r.Total);
            return Results.Ok(new Analytics(n, revenue, rows.Count, rows.Count == 0 ? 0 : Math.Round(revenue / rows.Count, 0),
                keys.Count(k => !before.Contains(k)), keys.Count(k => before.Contains(k)), rows.Count - returning.Count, returning.Count,
                series, categories, top, lowRows, out0, low));
        });

        // ---------- orders ----------
        // GET /api/admin/orders?status=packed&q=dhaka&district=dhaka&payment=cod&paymentStatus=unpaid&from=2026-11-01&to=2026-11-30&deliveryDate=2026-11-14&page=1&pageSize=20
        orders.MapGet("/orders", async Task<IResult> (AppDbContext db, string? status, string? q, string? district, string? payment, string? paymentStatus,
            string? from, string? to, string? deliveryDate, int? page, int? pageSize, CancellationToken ct) =>
        {
            // The storefront sends camelCase ("outForDelivery"); query-string enum binding is case-sensitive, so parse it ourselves.
            OrderStatus? wanted = null;
            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
                    return AdminSupport.Invalid("status", "Unknown order status.");
                wanted = parsed;
            }
            var query = OrderEndpoints.Everything(db).AsNoTracking().AsQueryable();
            if (wanted is not null) query = query.Where(o => o.Status == wanted);
            if (!string.IsNullOrWhiteSpace(district)) query = query.Where(o => o.District == district);
            if (!string.IsNullOrWhiteSpace(payment)) query = query.Where(o => o.Payment == payment);
            if (paymentStatus is "paid" or "refunded") query = query.Where(o => o.PaymentStatus == paymentStatus);
            else if (paymentStatus == "unpaid") query = query.Where(o => o.PaymentStatus != "paid" && o.PaymentStatus != "refunded");
            if (!string.IsNullOrWhiteSpace(deliveryDate)) query = query.Where(o => o.DeliveryDate == deliveryDate);
            if (AdminSupport.DayStartUtc(from) is { } f) query = query.Where(o => o.CreatedAt >= f);
            if (AdminSupport.DayStartUtc(to) is { } t) query = query.Where(o => o.CreatedAt < t.AddDays(1));
            if (!string.IsNullOrWhiteSpace(q))
            {
                var like = $"%{q.Trim()}%";
                query = query.Where(o => EF.Functions.ILike(o.Id, like) || EF.Functions.ILike(o.CustomerName, like) || EF.Functions.ILike(o.Phone, like));
            }
            var size = Math.Clamp(pageSize ?? 20, 1, 200);
            var total = await query.CountAsync(ct);
            var p = Math.Max(1, page ?? 1);
            var items = await query.OrderByDescending(o => o.CreatedAt).Skip((p - 1) * size).Take(size).ToListAsync(ct);
            return Results.Ok(new AdminOrdersPage([.. items.Select(OrderEndpoints.ToDto)], total, p, size));
        });

        orders.MapGet("/orders/{id}", async Task<IResult> (string id, AppDbContext db, CancellationToken ct) =>
            await OrderEndpoints.DetailAsync(db, id.Trim().ToUpperInvariant(), ct) is { } d ? Results.Ok(d) : Results.NotFound());

        // ---------- customers ----------
        read.MapGet("/customers", async Task<IResult> (AppDbContext db, string? q, int? page, CancellationToken ct) =>
        {
            const int size = 20;
            var users = db.Users.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(q))
            {
                var like = $"%{q.Trim()}%";
                users = users.Where(u => EF.Functions.ILike(u.Email!, like) || EF.Functions.ILike(u.FullName, like) || EF.Functions.ILike(u.PhoneNumber ?? "", like));
            }
            var total = await users.CountAsync(ct);
            var p = Math.Max(1, page ?? 1);
            var rows = await users.OrderByDescending(u => u.CreatedAt).Skip((p - 1) * size).Take(size).ToListAsync(ct);
            return Results.Ok(new CustomersPage([.. await ToCustomersAsync(db, rows, ct)], total, p, size));
        });

        read.MapGet("/customers/{id}", async Task<IResult> (string id, AppDbContext db, CancellationToken ct) =>
        {
            var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
            if (user is null) return Results.NotFound();
            var orders = await OrderEndpoints.Everything(db).AsNoTracking().Where(o => o.UserId == id).OrderByDescending(o => o.CreatedAt).Take(100).ToListAsync(ct);
            var addresses = await db.Addresses.AsNoTracking().Where(a => a.UserId == id).OrderBy(a => a.CreatedAt)
                .Select(a => new AddressDto(a.Id, a.Label, a.District, a.Area, a.Line)).ToArrayAsync(ct);
            return Results.Ok(new CustomerDetail((await ToCustomersAsync(db, [user], ct))[0], [.. orders.Select(OrderEndpoints.ToDto)], addresses));
        });

        // Locking blocks new sign-ins. (A sign-in that already happened stays valid until its token expires.)
        owner.MapPost("/customers/{id}/lock", async Task<IResult> (string id, LockInput? r, ClaimsPrincipal who, UserManager<AppUser> users, AppDbContext db, CancellationToken ct) =>
        {
            var user = await users.FindByIdAsync(id);
            if (user is null || r is null) return Results.NotFound();
            if (user.Id == who.FindFirstValue("sub") || (await users.GetRolesAsync(user)).Any(r => Roles.Staff.Contains(r)))
                return AdminSupport.Problem(StatusCodes.Status409Conflict, "STAFF_PROTECTED", "Staff accounts are managed on the Staff page.");
            await users.SetLockoutEnabledAsync(user, true);
            await users.SetLockoutEndDateAsync(user, r.Locked ? DateTimeOffset.MaxValue : null);
            if (!r.Locked) await users.ResetAccessFailedCountAsync(user);
            db.Audit(who, r.Locked ? "customer.lock" : "customer.unlock", "customer", user.Id, user.Email);
            await db.SaveChangesAsync(ct);
            return Results.Ok((await ToCustomersAsync(db, [user], ct))[0]);
        });

        // ---------- coupons ----------
        read.MapGet("/coupons", async (AppDbContext db, CancellationToken ct) =>
            Results.Ok((await db.PromoCodes.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct)).Select(ToDto)));

        write.MapPost("/coupons", async Task<IResult> (CouponInput? i, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var errors = ValidateCoupon(i, requireCode: true);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            i = i!;
            var code = i.Code!.Trim().ToUpperInvariant();
            if (await db.PromoCodes.AnyAsync(c => c.Code == code, ct)) return AdminSupport.Problem(StatusCodes.Status409Conflict, "CODE_TAKEN", "This code already exists.");
            var c = new PromoCode { Code = code, Kind = i.Kind, Value = i.Kind == "freeShip" ? 0 : i.Value };
            ApplyCoupon(c, i);
            db.PromoCodes.Add(c);
            db.Audit(who, "coupon.create", "coupon", code, $"{c.Kind} {c.Value}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(c));
        });

        write.MapPut("/coupons/{code}", async Task<IResult> (string code, CouponInput? i, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var errors = ValidateCoupon(i, requireCode: false);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            i = i!;
            var c = await db.PromoCodes.FirstOrDefaultAsync(x => x.Code == code.ToUpperInvariant(), ct);
            if (c is null) return Results.NotFound();
            c.Kind = i.Kind;
            c.Value = i.Kind == "freeShip" ? 0 : i.Value;
            ApplyCoupon(c, i);
            db.Audit(who, "coupon.update", "coupon", c.Code, $"{c.Kind} {c.Value}, {(c.Active ? "active" : "off")}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(c));
        });

        write.MapDelete("/coupons/{code}", async Task<IResult> (string code, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var c = await db.PromoCodes.FirstOrDefaultAsync(x => x.Code == code.ToUpperInvariant(), ct);
            if (c is null) return Results.NotFound();
            db.PromoCodes.Remove(c);
            db.Audit(who, "coupon.delete", "coupon", c.Code);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // ---------- settings ----------
        read.MapGet("/settings", async (AppDbContext db, CancellationToken ct) => Results.Ok(ToDto(await db.GetSettingsAsync(ct))));

        owner.MapPut("/settings", async Task<IResult> (SettingsDto? i, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var e = new Dictionary<string, string[]>();
            if (i is null) return AdminSupport.Invalid("settings", "Missing settings.");
            static bool Fee(decimal v) => v is >= 0 and <= 10000;
            if (i.FreeShippingThreshold is < 0 or > 1_000_000) e["freeShippingThreshold"] = ["Use 0–1,000,000."];
            if (!Fee(i.DhakaInnerFee) || !Fee(i.DhakaOuterFee)) e["dhakaFees"] = ["Fees must be ৳0–10,000."];
            if (i.DistrictFees is null || i.DistrictFees.Any(kv => !Pricing.Districts.Contains(kv.Key) || kv.Key == "dhaka" || !Fee(kv.Value)) || !i.DistrictFees.ContainsKey("other"))
                e["districtFees"] = ["Give every district a fee of ৳0–10,000 (including “other”)."];
            var slots = (i.Slots ?? []).Distinct().ToArray();
            if (slots.Length == 0 || slots.Any(sl => !Pricing.Slots.Contains(sl))) e["slots"] = ["Keep at least one delivery slot."];
            if (i.LowStockAt is < 0 or > 1000) e["lowStockAt"] = ["Use 0–1000."];
            if (string.IsNullOrWhiteSpace(i.ShopName) || i.ShopName.Length > 80) e["shopName"] = ["Enter the shop name."];
            if (i.Phone?.Length > 30) e["phone"] = ["Too long."];
            if (i.Email?.Length > 254 || (!string.IsNullOrWhiteSpace(i.Email) && !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(i.Email))) e["email"] = ["Enter a valid email."];
            if (i.Address?.Length > 200) e["address"] = ["Too long."];
            if (e.Count > 0) return Results.ValidationProblem(e);

            var s = await db.GetSettingsAsync(ct);
            s.FreeShippingThreshold = i.FreeShippingThreshold;
            s.DhakaInnerFee = i.DhakaInnerFee;
            s.DhakaOuterFee = i.DhakaOuterFee;
            s.DistrictFees = new Dictionary<string, decimal>(i.DistrictFees!);
            s.Slots = string.Join(',', Pricing.Slots.Where(x => slots.Contains(x))); // keep the canonical order
            s.LowStockAt = i.LowStockAt;
            s.ShopName = i.ShopName.Trim();
            s.Phone = i.Phone?.Trim() ?? "";
            s.Email = i.Email?.Trim() ?? "";
            s.Address = i.Address?.Trim() ?? "";
            s.UpdatedAt = DateTime.UtcNow;
            db.Audit(who, "settings.update", "settings", "1", $"free shipping ≥ ৳{s.FreeShippingThreshold}; slots {s.Slots}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(s));
        });

        // ---------- review moderation ----------
        read.MapGet("/reviews", async Task<IResult> (AppDbContext db, bool? hidden, int? page, CancellationToken ct) =>
        {
            const int size = 20;
            var query = db.Reviews.AsNoTracking().AsQueryable();
            if (hidden is not null) query = query.Where(r => r.Hidden == hidden);
            var total = await query.CountAsync(ct);
            var p = Math.Max(1, page ?? 1);
            var rows = await query.OrderByDescending(r => r.CreatedAt).Skip((p - 1) * size).Take(size).ToListAsync(ct);
            return Results.Ok(new AdminReviewsPage([.. rows.Select(ToDto)], total, p, size));
        });

        write.MapPost("/reviews/{id:guid}/hide", async Task<IResult> (Guid id, LockInput? r, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var review = await db.Reviews.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (review is null || r is null) return Results.NotFound();
            review.Hidden = r.Locked; // reuses the {locked:bool} shape: true = hide
            db.Audit(who, review.Hidden ? "review.hide" : "review.show", "review", id.ToString(), $"{review.Slug} · {review.AuthorName}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(review));
        });

        // ---------- audit log + staff (owner only) ----------
        owner.MapGet("/audit", async Task<IResult> (AppDbContext db, string? entity, int? page, CancellationToken ct) =>
        {
            const int size = 50;
            var query = db.AuditLog.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(entity)) query = query.Where(a => a.Entity == entity);
            var total = await query.CountAsync(ct);
            var p = Math.Max(1, page ?? 1);
            var rows = await query.OrderByDescending(a => a.Id).Skip((p - 1) * size).Take(size).ToListAsync(ct);
            return Results.Ok(new AuditPage([.. rows.Select(a => new AuditDto(a.Id, a.At, a.ActorEmail, a.Action, a.Entity, a.EntityId, a.Detail))], total, p, size));
        });

        owner.MapGet("/staff", async Task<IResult> (AppDbContext db, CancellationToken ct) =>
        {
            var rows = await (from ur in db.UserRoles join r in db.Roles on ur.RoleId equals r.Id join u in db.Users on ur.UserId equals u.Id
                              where Roles.Staff.Contains(r.Name!) select new { u.Id, u.FullName, u.Email, Role = r.Name!, u.CreatedAt }).AsNoTracking().ToListAsync(ct);
            return Results.Ok(rows.OrderBy(r => r.Role).ThenBy(r => r.Email).Select(r => new StaffDto(r.Id, r.FullName, r.Email ?? "", r.Role, r.CreatedAt)));
        });

        // Give an existing account a staff role. The person registers on the site first; we never handle their password.
        owner.MapPost("/staff", async Task<IResult> (StaffInput? i, ClaimsPrincipal who, UserManager<AppUser> users, AppDbContext db, CancellationToken ct) =>
        {
            if (i?.Role is null || !Roles.Staff.Contains(i.Role)) return AdminSupport.Invalid("role", "Choose a role.");
            var user = string.IsNullOrWhiteSpace(i.Email) ? null : await users.FindByEmailAsync(i.Email.Trim());
            if (user is null) return AdminSupport.Problem(StatusCodes.Status404NotFound, "USER_NOT_FOUND", "No account with that email. Ask them to register on the site first.");
            if (user.Id == who.FindFirstValue("sub")) return AdminSupport.Problem(StatusCodes.Status409Conflict, "CANT_CHANGE_SELF", "You can't change your own role.");

            await users.RemoveFromRolesAsync(user, (await users.GetRolesAsync(user)).Where(r => Roles.Staff.Contains(r)).ToList());
            await users.AddToRoleAsync(user, i.Role);
            db.Audit(who, "staff.set", "staff", user.Id, $"{user.Email} -> {i.Role}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(new StaffDto(user.Id, user.FullName, user.Email ?? "", i.Role, user.CreatedAt));
        });

        owner.MapDelete("/staff/{id}", async Task<IResult> (string id, ClaimsPrincipal who, UserManager<AppUser> users, AppDbContext db, CancellationToken ct) =>
        {
            var user = await users.FindByIdAsync(id);
            if (user is null) return Results.NotFound();
            if (user.Id == who.FindFirstValue("sub")) return AdminSupport.Problem(StatusCodes.Status409Conflict, "CANT_CHANGE_SELF", "You can't remove your own access.");
            await users.RemoveFromRolesAsync(user, (await users.GetRolesAsync(user)).Where(r => Roles.Staff.Contains(r)).ToList());
            db.Audit(who, "staff.remove", "staff", user.Id, user.Email);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });
    }

    // ---------- helpers ----------
    private static async Task<CustomerDto[]> ToCustomersAsync(AppDbContext db, List<AppUser> rows, CancellationToken ct)
    {
        var ids = rows.Select(u => u.Id).ToList();
        var agg = await db.Orders.AsNoTracking().Where(o => o.UserId != null && ids.Contains(o.UserId) && o.Status != OrderStatus.Cancelled)
            .GroupBy(o => o.UserId!).Select(g => new { Id = g.Key, Count = g.Count(), Spent = g.Sum(o => o.Total), Last = g.Max(o => o.CreatedAt) }).ToListAsync(ct);
        var roles = await (from ur in db.UserRoles join r in db.Roles on ur.RoleId equals r.Id where ids.Contains(ur.UserId) select new { ur.UserId, r.Name }).AsNoTracking().ToListAsync(ct);
        return [.. rows.Select(u =>
        {
            var a = agg.FirstOrDefault(x => x.Id == u.Id);
            return new CustomerDto(u.Id, u.FullName, u.Email ?? "", u.PhoneNumber ?? "", u.CreatedAt,
                u.LockoutEnd is { } end && end > DateTimeOffset.UtcNow,
                [.. roles.Where(r => r.UserId == u.Id).Select(r => r.Name!)], a?.Count ?? 0, a?.Spent ?? 0, a?.Last);
        })];
    }

    private static CouponDto ToDto(PromoCode c) => new(c.Code, c.Kind, c.Value, c.MinSubtotal, c.ExpiresAt, c.UsageLimit, c.Used, c.Active, c.CreatedAt);

    private static SettingsDto ToDto(ShopSettings s) => new(s.FreeShippingThreshold, s.DhakaInnerFee, s.DhakaOuterFee, s.DistrictFees, s.SlotList(),
        s.LowStockAt, s.ShopName, s.Phone, s.Email, s.Address);

    private static AdminReviewDto ToDto(Review r) => new(r.Id.ToString(), r.Slug, r.AuthorName, r.Rating, r.Title, r.Text, r.CreatedAt, r.VerifiedPurchase, r.Hidden);

    private static void ApplyCoupon(PromoCode c, CouponInput i)
    {
        c.MinSubtotal = i.MinSubtotal;
        c.ExpiresAt = i.ExpiresAt is { } d ? DateTime.SpecifyKind(d.ToUniversalTime(), DateTimeKind.Utc) : null; // timestamptz needs UTC
        c.UsageLimit = i.UsageLimit;
        c.Active = i.Active;
    }

    private static Dictionary<string, string[]> ValidateCoupon(CouponInput? i, bool requireCode)
    {
        var e = new Dictionary<string, string[]>();
        if (i is null) { e["coupon"] = ["Missing coupon."]; return e; }
        if (requireCode && (i.Code is null || !CodeRx().IsMatch(i.Code.Trim().ToUpperInvariant()))) e["code"] = ["Use 3–30 letters or numbers."];
        if (i.Kind is not ("percent" or "fixed" or "freeShip")) e["kind"] = ["Choose a coupon type."];
        else if (i.Kind == "percent" && i.Value is < 1 or > 100) e["value"] = ["Percent must be 1–100."];
        else if (i.Kind == "fixed" && i.Value is < 1 or > 100_000) e["value"] = ["Amount must be ৳1–100,000."];
        if (i.MinSubtotal is < 0 or > 1_000_000) e["minSubtotal"] = ["Minimum spend must be ৳0–1,000,000."];
        if (i.UsageLimit is < 1) e["usageLimit"] = ["Usage limit must be at least 1 (or empty for unlimited)."];
        return e;
    }
}
