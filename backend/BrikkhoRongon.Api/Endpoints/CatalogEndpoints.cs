using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

// The JSON shape mirrors the storefront's `Product` type (src/data/types.ts) so the web app can use it as is.
public record ImageDto(string Src, int Width, int Height);
public record CareDto(Light Light, Water Water, Difficulty Difficulty);
public record BonsaiDto(BonsaiStyle Style, int AgeYears, int HeightCm, Placement Placement);
public record ProductDto(
    int Id, string Slug, string Name, string Description, Category Category, decimal Price,
    ImageDto Image, CareDto Care, BonsaiDto? Bonsai, bool Featured, bool NeedsReview);

public static class CatalogEndpoints
{
    public static void MapCatalog(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/products").WithTags("Catalog");

        // GET /api/products?category=bonsai&q=ficus&sort=priceAsc&lang=bn
        g.MapGet("/", async (AppDbContext db, Category? category, Light? light, Difficulty? level,
            string? q, string? sort, string? lang, CancellationToken ct) =>
        {
            var query = db.Products.AsNoTracking().AsQueryable();
            if (category is not null) query = query.Where(p => p.Category == category);
            if (light is not null) query = query.Where(p => p.Light == light);
            if (level is not null) query = query.Where(p => p.Difficulty == level);
            if (!string.IsNullOrWhiteSpace(q))
            {
                var like = $"%{q.Trim()}%";
                query = query.Where(p => EF.Functions.ILike(p.NameEn, like) || EF.Functions.ILike(p.NameBn, like) || EF.Functions.ILike(p.Slug, like));
            }

            query = sort switch
            {
                "priceAsc" => query.OrderBy(p => p.Price).ThenBy(p => p.Id),
                "priceDesc" => query.OrderByDescending(p => p.Price).ThenBy(p => p.Id),
                "nameAsc" => query.OrderBy(p => p.NameEn),
                _ => query.OrderByDescending(p => p.Featured).ThenBy(p => p.Id),
            };

            var items = await query.ToListAsync(ct);
            return Results.Ok(items.Select(p => ToDto(p, lang)));
        });

        g.MapGet("/{slug}", async (AppDbContext db, string slug, string? lang, CancellationToken ct) =>
        {
            var p = await db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Slug == slug, ct);
            return p is null ? Results.NotFound() : Results.Ok(ToDto(p, lang));
        });
    }

    private static ProductDto ToDto(Product p, string? lang)
    {
        var bn = lang == "bn";
        return new ProductDto(
            p.Id, p.Slug, bn ? p.NameBn : p.NameEn, bn ? p.DescriptionBn : p.DescriptionEn, p.Category, p.Price,
            new ImageDto(p.ImageSrc, p.ImageWidth, p.ImageHeight),
            new CareDto(p.Light, p.Water, p.Difficulty),
            p.BonsaiStyle is { } style
                ? new BonsaiDto(style, p.BonsaiAgeYears ?? 0, p.BonsaiHeightCm ?? 0, p.BonsaiPlacement ?? Placement.Indoor)
                : null,
            p.Featured, p.NeedsReview);
    }
}
