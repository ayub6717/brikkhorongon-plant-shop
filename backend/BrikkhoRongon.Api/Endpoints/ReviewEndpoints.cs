using System.Security.Claims;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

public record ReviewRequest(string Slug, int Rating, string? Title, string Text);
public record ReviewDto(string Id, string Slug, string Name, int Rating, string Title, string Text, DateTime At, bool Verified, bool CanDelete);
public record RatingSummaryDto(string Slug, int Count, double Average, int[] Distribution);

public static class ReviewEndpoints
{
    public static void MapReviews(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/reviews").WithTags("Reviews").RequireRateLimiting("orders");

        // Public: reviews of one plant, newest first. CanDelete tells the UI whether to show a delete button to *this* visitor.
        g.MapGet("/", async Task<IResult> (string? slug, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(slug)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["slug"] = ["slug is required."] });
            var me = principal.FindFirstValue("sub");
            var admin = principal.IsInRole(Roles.Admin);
            var rows = await db.Reviews.AsNoTracking().Where(r => r.Slug == slug).OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
            return Results.Ok(rows.Select(r => ToDto(r, admin || (me is not null && r.UserId == me))));
        });

        // Public: average and star counts per plant, for the little "★ 4.5 (3)" badges on product cards.
        g.MapGet("/summaries", async Task<IResult> (AppDbContext db, CancellationToken ct) =>
        {
            var rows = await db.Reviews.AsNoTracking().Select(r => new { r.Slug, r.Rating }).ToListAsync(ct);
            var summaries = rows.GroupBy(r => r.Slug).Select(x => new RatingSummaryDto(
                x.Key, x.Count(), x.Average(r => r.Rating), [.. Enumerable.Range(1, 5).Select(star => x.Count(r => r.Rating == star))]));
            return Results.Ok(summaries);
        });

        g.MapPost("/", async Task<IResult> (ReviewRequest? r, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var userId = principal.FindFirstValue("sub");
            if (userId is null) return Results.Unauthorized();

            var errors = new Dictionary<string, string[]>();
            if (r is null || string.IsNullOrWhiteSpace(r.Slug)) errors["slug"] = ["Choose a plant."];
            if (r is not null && r.Rating is < 1 or > 5) errors["rating"] = ["Choose 1 to 5 stars."];
            if (r?.Text is null || r.Text.Trim().Length is < 10 or > 600) errors["text"] = ["Write 10–600 characters."];
            if (r?.Title?.Length > 80) errors["title"] = ["The title is too long."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            r = r!;

            if (!await db.Products.AnyAsync(p => p.Slug == r.Slug, ct)) return Results.NotFound();
            if (await db.Reviews.AnyAsync(x => x.UserId == userId && x.Slug == r.Slug, ct))
                return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "You have already reviewed this plant.",
                    extensions: new Dictionary<string, object?> { ["code"] = "ALREADY_REVIEWED" });

            var verified = await db.Orders.AnyAsync(o => o.UserId == userId && o.Status == OrderStatus.Delivered && o.Lines.Any(l => l.Slug == r.Slug), ct);
            var review = new Review
            {
                Slug = r.Slug, UserId = userId, AuthorName = principal.FindFirstValue("name") ?? "Customer",
                Rating = r.Rating, Title = r.Title?.Trim() ?? "", Text = r.Text.Trim(), VerifiedPurchase = verified,
            };
            db.Reviews.Add(review);
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(review, true));
        }).RequireAuthorization();

        // The author, or the shop team (moderation), can remove a review.
        g.MapDelete("/{id:guid}", async Task<IResult> (Guid id, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (review is null) return Results.NotFound();
            if (review.UserId != principal.FindFirstValue("sub") && !principal.IsInRole(Roles.Admin)) return Results.Forbid();
            db.Reviews.Remove(review);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        }).RequireAuthorization();
    }

    private static ReviewDto ToDto(Review r, bool canDelete) =>
        new(r.Id.ToString(), r.Slug, r.AuthorName, r.Rating, r.Title, r.Text, r.CreatedAt, r.VerifiedPurchase, canDelete);
}
