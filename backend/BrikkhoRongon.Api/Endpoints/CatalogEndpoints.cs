using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using BrikkhoRongon.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

// The JSON shape mirrors the storefront's `Product` type (src/data/types.ts) so the web app can use it as is.
public record ImageDto(string Src, int Width, int Height);
public record CareDto(Light Light, Water Water, Difficulty Difficulty);
public record BonsaiDto(BonsaiStyle Style, int AgeYears, int HeightCm, Placement Placement);
public record ProductDto(
    int Id, string Slug, string Name, string Description, Category Category, decimal Price,
    ImageDto Image, CareDto Care, BonsaiDto? Bonsai, bool Featured, bool NeedsReview, int? Stock);

/// <summary>Both languages at once: what the admin edits, and what the storefront caches.</summary>
public record ProductFull(
    int Id, string Slug, string NameEn, string NameBn, string DescriptionEn, string DescriptionBn, Category Category, decimal Price,
    int? Stock, bool Hidden, bool Featured, bool NeedsReview, ImageDto Image, CareDto Care, BonsaiDto? Bonsai, DateTime? UpdatedAt);

public record PublicCoupon(string Code, string Kind, int Value, int MinSubtotal, DateTime? ExpiresAt, int? Remaining);
public record PublicSettings(decimal FreeShippingThreshold, decimal DhakaInnerFee, decimal DhakaOuterFee, Dictionary<string, decimal> DistrictFees,
    string[] Slots, string ShopName, string Phone, string Email, string Address);
public record CatalogPayload(ProductFull[] Products, PublicCoupon[] Coupons, PublicSettings Settings);

public static class CatalogEndpoints
{
    public static void MapCatalog(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/products").WithTags("Catalog");

        // GET /api/products?category=bonsai&q=ficus&sort=priceAsc&lang=bn
        g.MapGet("/", async (AppDbContext db, Category? category, Light? light, Difficulty? level,
            string? q, string? sort, string? lang, CancellationToken ct) =>
        {
            var query = db.Products.AsNoTracking().Where(p => !p.Hidden);
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
            var p = await db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Slug == slug && !x.Hidden, ct);
            return p is null ? Results.NotFound() : Results.Ok(ToDto(p, lang));
        });

        // Everything the storefront needs to render itself, in one call. The web app caches this for a minute
        // (and clears the cache the moment the shop team saves a change).
        app.MapGet("/api/catalog", async (AppDbContext db, CancellationToken ct) =>
        {
            var now = DateTime.UtcNow;
            var products = await db.Products.AsNoTracking().Where(p => !p.Hidden).OrderBy(p => p.Id).ToListAsync(ct);
            var coupons = (await db.PromoCodes.AsNoTracking().Where(c => c.Active).ToListAsync(ct))
                .Where(c => (c.ExpiresAt is null || c.ExpiresAt > now) && (c.UsageLimit is null || c.Used < c.UsageLimit))
                .Select(c => new PublicCoupon(c.Code, c.Kind, c.Value, c.MinSubtotal, c.ExpiresAt, c.UsageLimit is { } l ? l - c.Used : null))
                .ToArray();
            var s = await db.GetSettingsAsync(ct);
            return Results.Ok(new CatalogPayload([.. products.Select(ToFull)], coupons,
                new PublicSettings(s.FreeShippingThreshold, s.DhakaInnerFee, s.DhakaOuterFee, s.DistrictFees, s.SlotList(),
                    s.ShopName, s.Phone, s.Email, s.Address)));
        }).WithTags("Catalog");

        // Uploaded product photos. The id is an unguessable GUID and the bytes never change, so they cache forever.
        app.MapGet("/api/images/{id:guid}", async (Guid id, AppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            var img = await db.ProductImages.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id, ct);
            if (img is null) return Results.NotFound();
            http.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return Results.File(img.Data, img.ContentType);
        }).WithTags("Catalog");
    }

    internal static ProductFull ToFull(Product p) => new(
        p.Id, p.Slug, p.NameEn, p.NameBn, p.DescriptionEn, p.DescriptionBn, p.Category, p.Price, p.Stock, p.Hidden, p.Featured, p.NeedsReview,
        new ImageDto(p.ImageSrc, p.ImageWidth, p.ImageHeight),
        new CareDto(p.Light, p.Water, p.Difficulty),
        p.BonsaiStyle is { } style
            ? new BonsaiDto(style, p.BonsaiAgeYears ?? 0, p.BonsaiHeightCm ?? 0, p.BonsaiPlacement ?? Placement.Indoor)
            : null,
        p.UpdatedAt);

    private static ProductDto ToDto(Product p, string? lang)
    {
        var bn = lang == "bn";
        var f = ToFull(p);
        return new ProductDto(p.Id, p.Slug, bn ? p.NameBn : p.NameEn, bn ? p.DescriptionBn : p.DescriptionEn, p.Category, p.Price,
            f.Image, f.Care, f.Bonsai, p.Featured, p.NeedsReview, p.Stock);
    }
}
