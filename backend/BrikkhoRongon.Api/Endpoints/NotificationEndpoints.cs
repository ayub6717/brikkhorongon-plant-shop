using System.Security.Claims;
using BrikkhoRongon.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

public record NotificationDto(string Id, string Kind, string? OrderId, DateTime CreatedAt, bool Read);
public record NotificationsPage(NotificationDto[] Items, int Unread);

/// <summary>The signed-in customer's own notifications. Nobody can read or mark anyone else's.</summary>
public static class NotificationEndpoints
{
    public static void MapNotifications(this WebApplication app)
    {
        var g = app.MapGroup("/api/me/notifications").WithTags("Account").RequireAuthorization();

        g.MapGet("/", async Task<IResult> (ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var userId = who.FindFirstValue("sub");
            var rows = await db.Notifications.AsNoTracking().Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt).Take(30).ToListAsync(ct);
            var unread = await db.Notifications.CountAsync(n => n.UserId == userId && n.ReadAt == null, ct);
            return Results.Ok(new NotificationsPage([.. rows.Select(n => new NotificationDto(n.Id.ToString(), n.Kind, n.OrderId, n.CreatedAt, n.ReadAt != null))], unread));
        });

        g.MapPost("/{id:guid}/read", async Task<IResult> (Guid id, ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var userId = who.FindFirstValue("sub");
            var now = DateTime.UtcNow;
            await db.Notifications.Where(n => n.Id == id && n.UserId == userId && n.ReadAt == null)
                .ExecuteUpdateAsync(u => u.SetProperty(n => n.ReadAt, now), ct);
            return Results.NoContent();
        });

        g.MapPost("/read-all", async Task<IResult> (ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var userId = who.FindFirstValue("sub");
            var now = DateTime.UtcNow;
            await db.Notifications.Where(n => n.UserId == userId && n.ReadAt == null)
                .ExecuteUpdateAsync(u => u.SetProperty(n => n.ReadAt, now), ct);
            return Results.NoContent();
        });
    }
}
