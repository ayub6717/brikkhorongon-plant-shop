using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

public record DayStat(string Date, int Orders, decimal Value);
public record TopPlant(string Slug, string Name, int Qty, decimal Value);
public record AdminStats(
    int OrderCount, decimal OrderValue, int PendingRequests, int NeedsAction,
    Dictionary<string, int> ByStatus, DayStat[] Last7Days, TopPlant[] TopPlants);
public record AdminOrdersPage(OrderDto[] Items, int Total, int Page, int PageSize);

/// <summary>Numbers and lists for the /admin dashboard. Admin role only.</summary>
public static class AdminEndpoints
{
    public static void MapAdmin(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization(p => p.RequireRole(Roles.Admin));

        g.MapGet("/stats", async Task<IResult> (AppDbContext db, CancellationToken ct) =>
        {
            var byStatus = await db.Orders.GroupBy(o => o.Status).Select(x => new { Status = x.Key, Count = x.Count() }).ToListAsync(ct);
            var counts = Enum.GetValues<OrderStatus>().ToDictionary(s => ToCamel(s.ToString()), s => byStatus.FirstOrDefault(x => x.Status == s)?.Count ?? 0);

            // "Today" is a Bangladesh day (UTC+6): that is when the shop actually opens and closes.
            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6));
            // Start of that Bangladesh day, expressed in UTC. The Kind must be Utc: PostgreSQL's timestamptz refuses "unspecified" times.
            var from = DateTime.SpecifyKind(today.AddDays(-6).ToDateTime(TimeOnly.MinValue).AddHours(-6), DateTimeKind.Utc);
            var recent = await db.Orders.AsNoTracking().Where(o => o.CreatedAt >= from).Select(o => new { o.CreatedAt, o.Total }).ToListAsync(ct);
            var days = Enumerable.Range(0, 7).Select(i => today.AddDays(i - 6)).Select(d =>
            {
                var rows = recent.Where(o => DateOnly.FromDateTime(o.CreatedAt.AddHours(6)) == d).ToList();
                return new DayStat(d.ToString("yyyy-MM-dd"), rows.Count, rows.Sum(o => o.Total));
            }).ToArray();

            // Group in the database, then shape the result in memory (EF can't always order by a constructed record).
            var topRows = await db.OrderLines.GroupBy(l => new { l.Slug, l.Name })
                .Select(x => new { x.Key.Slug, x.Key.Name, Qty = x.Sum(l => l.Qty), Value = x.Sum(l => l.Qty * l.UnitPrice) })
                .OrderByDescending(x => x.Qty).Take(5).ToListAsync(ct);
            var top = topRows.Select(x => new TopPlant(x.Slug, x.Name, x.Qty, x.Value)).ToArray();

            var stats = new AdminStats(
                OrderCount: await db.Orders.CountAsync(ct),
                OrderValue: await db.Orders.SumAsync(o => o.Total, ct),
                PendingRequests: await db.Orders.SelectMany(o => o.Requests).CountAsync(r => r.Status == RequestStatus.Pending, ct),
                NeedsAction: await db.Orders.CountAsync(o => o.Status != OrderStatus.Delivered, ct),
                ByStatus: counts, Last7Days: days, TopPlants: top);
            return Results.Ok(stats);
        });

        // GET /api/admin/orders?status=packed&q=dhaka&page=1
        g.MapGet("/orders", async Task<IResult> (AppDbContext db, string? status, string? q, int? page, CancellationToken ct) =>
        {
            const int pageSize = 20;
            // The storefront sends camelCase ("outForDelivery"); query-string enum binding is case-sensitive, so parse it ourselves.
            OrderStatus? wanted = null;
            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
                    return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Unknown order status."] });
                wanted = parsed;
            }
            var query = OrderEndpoints.Everything(db).AsNoTracking().AsQueryable();
            if (wanted is not null) query = query.Where(o => o.Status == wanted);
            if (!string.IsNullOrWhiteSpace(q))
            {
                var like = $"%{q.Trim()}%";
                query = query.Where(o => EF.Functions.ILike(o.Id, like) || EF.Functions.ILike(o.CustomerName, like) || EF.Functions.ILike(o.Phone, like));
            }
            var total = await query.CountAsync(ct);
            var p = Math.Max(1, page ?? 1);
            var items = await query.OrderByDescending(o => o.CreatedAt).Skip((p - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return Results.Ok(new AdminOrdersPage([.. items.Select(OrderEndpoints.ToDto)], total, p, pageSize));
        });
    }

    private static string ToCamel(string s) => char.ToLowerInvariant(s[0]) + s[1..];
}
