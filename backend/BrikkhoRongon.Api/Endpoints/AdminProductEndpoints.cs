using System.Text.RegularExpressions;
using BrikkhoRongon.Api.Auth;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using BrikkhoRongon.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

public record ProductInput(
    string? Slug, string NameEn, string? NameBn, string DescriptionEn, string? DescriptionBn, Category Category, decimal Price,
    int? Stock, bool Hidden, bool Featured, bool NeedsReview, ImageDto? Image, CareDto Care, BonsaiDto? Bonsai);
public record VisibilityInput(bool Hidden);
public record BulkInput(int[] Ids, string? PriceMode, decimal? PriceValue, string? StockMode, int? StockValue, bool? Hidden, bool? Featured);
public record ImportInput(ProductInput[] Rows);
public record UploadInput(string ContentType, string Data);

/// <summary>Add, edit, hide, delete and bulk-change plants. Reading needs Read; changing needs Write (Owner or Manager).</summary>
public static partial class AdminProductEndpoints
{
    private const int MaxImageBytes = 1_500_000;

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugRx();

    public static void MapAdminProducts(this IEndpointRouteBuilder app)
    {
        var read = app.MapGroup("/api/admin/products").WithTags("Admin products").RequireAuthorization(Policies.Read);
        var write = app.MapGroup("/api/admin/products").WithTags("Admin products").RequireAuthorization(Policies.Write);

        // GET /api/admin/products?q=fern&category=bonsai&stock=low|out|untracked&hidden=true
        read.MapGet("/", async Task<IResult> (AppDbContext db, string? q, string? category, string? stock, bool? hidden, CancellationToken ct) =>
        {
            var query = db.Products.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(category))
            {
                if (!Enum.TryParse<Category>(category, true, out var c)) return AdminSupport.Invalid("category", "Unknown category.");
                query = query.Where(p => p.Category == c);
            }
            if (hidden is not null) query = query.Where(p => p.Hidden == hidden);
            if (!string.IsNullOrWhiteSpace(q))
            {
                var like = $"%{q.Trim()}%";
                query = query.Where(p => EF.Functions.ILike(p.NameEn, like) || EF.Functions.ILike(p.NameBn, like) || EF.Functions.ILike(p.Slug, like));
            }
            var low = (await db.GetSettingsAsync(ct)).LowStockAt;
            query = stock switch
            {
                "low" => query.Where(p => p.Stock != null && p.Stock > 0 && p.Stock <= low),
                "out" => query.Where(p => p.Stock != null && p.Stock <= 0),
                "untracked" => query.Where(p => p.Stock == null),
                _ => query,
            };
            var items = await query.OrderBy(p => p.Id).Take(1000).ToListAsync(ct);
            return Results.Ok(items.Select(CatalogEndpoints.ToFull));
        });

        read.MapGet("/{id:int}", async Task<IResult> (int id, AppDbContext db, CancellationToken ct) =>
            await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct) is { } p ? Results.Ok(CatalogEndpoints.ToFull(p)) : Results.NotFound());

        write.MapPost("/", async Task<IResult> (ProductInput? input, System.Security.Claims.ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var errors = Validate(input);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            input = input!;

            var id = (await db.Products.MaxAsync(p => (int?)p.Id, ct) ?? 0) + 1;
            var slug = string.IsNullOrWhiteSpace(input.Slug) ? Slugify(input.NameEn, id) : input.Slug.Trim();
            if (await db.Products.AnyAsync(p => p.Slug == slug, ct))
                return AdminSupport.Problem(StatusCodes.Status409Conflict, "SLUG_TAKEN", "Another plant already uses this web address (slug).");

            var product = new Product { Id = id, Slug = slug, NameEn = "", NameBn = "", DescriptionEn = "", DescriptionBn = "", ImageSrc = "" };
            Apply(product, input, slug);
            db.Products.Add(product);
            db.Audit(who, "product.create", "product", id.ToString(), $"{product.NameEn} · ৳{product.Price}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(CatalogEndpoints.ToFull(product));
        });

        write.MapPut("/{id:int}", async Task<IResult> (int id, ProductInput? input, System.Security.Claims.ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var errors = Validate(input);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            input = input!;
            var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (product is null) return Results.NotFound();

            // Changing a slug breaks old links, so we keep the existing one unless a new one is asked for explicitly.
            var slug = string.IsNullOrWhiteSpace(input.Slug) ? product.Slug : input.Slug.Trim();
            if (slug != product.Slug && await db.Products.AnyAsync(p => p.Slug == slug, ct))
                return AdminSupport.Problem(StatusCodes.Status409Conflict, "SLUG_TAKEN", "Another plant already uses this web address (slug).");

            var before = $"৳{product.Price}, stock {product.Stock?.ToString() ?? "-"}, {(product.Hidden ? "hidden" : "visible")}";
            Apply(product, input, slug);
            db.Audit(who, "product.update", "product", id.ToString(), $"{product.NameEn}: {before} -> ৳{product.Price}, stock {product.Stock?.ToString() ?? "-"}, {(product.Hidden ? "hidden" : "visible")}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(CatalogEndpoints.ToFull(product));
        });

        write.MapPost("/{id:int}/visibility", async Task<IResult> (int id, VisibilityInput? input, System.Security.Claims.ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (product is null || input is null) return Results.NotFound();
            product.Hidden = input.Hidden;
            product.UpdatedAt = DateTime.UtcNow;
            db.Audit(who, input.Hidden ? "product.hide" : "product.show", "product", id.ToString(), product.NameEn);
            await db.SaveChangesAsync(ct);
            return Results.Ok(CatalogEndpoints.ToFull(product));
        });

        // Past orders keep their own copy of the name, price and image, so deleting a plant never damages them.
        write.MapDelete("/{id:int}", async Task<IResult> (int id, System.Security.Claims.ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (product is null) return Results.NotFound();
            db.Products.Remove(product);
            db.Audit(who, "product.delete", "product", id.ToString(), $"{product.NameEn} ({product.Slug})");
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // Change price/stock/visibility of many plants at once.
        write.MapPost("/bulk", async Task<IResult> (BulkInput? input, System.Security.Claims.ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            if (input?.Ids is not { Length: > 0 and <= 500 }) return AdminSupport.Invalid("ids", "Choose 1–500 plants.");
            if (input.PriceMode is not (null or "set" or "percent" or "add")) return AdminSupport.Invalid("priceMode", "Use set, percent or add.");
            if (input.StockMode is not (null or "set" or "add" or "untrack")) return AdminSupport.Invalid("stockMode", "Use set, add or untrack.");
            if (input.PriceMode is not null && input.PriceValue is null) return AdminSupport.Invalid("priceValue", "Enter a price value.");
            if (input.StockMode is ("set" or "add") && input.StockValue is null) return AdminSupport.Invalid("stockValue", "Enter a stock value.");

            var ids = input.Ids.Distinct().ToList();
            var products = await db.Products.Where(p => ids.Contains(p.Id)).ToListAsync(ct);
            foreach (var p in products)
            {
                if (input.PriceMode is { } pm)
                {
                    var v = input.PriceValue!.Value;
                    var price = pm switch { "set" => v, "percent" => p.Price * (1 + v / 100m), _ => p.Price + v };
                    price = Math.Round(price, 0, MidpointRounding.AwayFromZero);
                    if (price is < 1 or > 1_000_000) return AdminSupport.Invalid("priceValue", $"That would make “{p.NameEn}” cost ৳{price}. Prices must be 1–1,000,000.");
                    p.Price = price;
                }
                switch (input.StockMode)
                {
                    case "set": p.Stock = Math.Clamp(input.StockValue!.Value, 0, 100_000); break;
                    case "add": p.Stock = Math.Clamp((p.Stock ?? 0) + input.StockValue!.Value, 0, 100_000); break;
                    case "untrack": p.Stock = null; break;
                }
                if (input.Hidden is { } h) p.Hidden = h;
                if (input.Featured is { } f) p.Featured = f;
                p.UpdatedAt = DateTime.UtcNow;
            }
            db.Audit(who, "product.bulk", "product", null,
                $"{products.Count} plants; price {input.PriceMode ?? "-"} {input.PriceValue}; stock {input.StockMode ?? "-"} {input.StockValue}; hidden {input.Hidden}; featured {input.Featured}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { updated = products.Count });
        });

        // CSV import. The browser parses the file and sends rows; plants are matched by slug (new slug = new plant).
        // All or nothing: if any row is wrong, nothing is saved and every problem is listed.
        write.MapPost("/import", async Task<IResult> (ImportInput? input, System.Security.Claims.ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            if (input?.Rows is not { Length: > 0 and <= 300 }) return AdminSupport.Invalid("rows", "Send 1–300 rows.");
            var problems = new List<string>();
            var seen = new HashSet<string>();
            for (var i = 0; i < input.Rows.Length; i++)
            {
                var row = input.Rows[i];
                if (row is null) { problems.Add($"Row {i + 1}: empty row."); continue; }
                var errs = Validate(row);
                if (string.IsNullOrWhiteSpace(row?.Slug)) errs["slug"] = ["Every row needs a slug."];
                else if (!seen.Add(row.Slug.Trim())) errs["slug"] = ["Duplicate slug in the file."];
                foreach (var e in errs) problems.Add($"Row {i + 1} ({e.Key}): {e.Value[0]}");
            }
            if (problems.Count > 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = [.. problems.Take(30)] });

            var slugs = input.Rows.Select(r => r.Slug!.Trim()).ToList();
            var existing = await db.Products.Where(p => slugs.Contains(p.Slug)).ToDictionaryAsync(p => p.Slug, ct);
            var nextId = (await db.Products.MaxAsync(p => (int?)p.Id, ct) ?? 0) + 1;
            int created = 0, updated = 0;
            foreach (var row in input.Rows)
            {
                var slug = row.Slug!.Trim();
                if (existing.TryGetValue(slug, out var p)) { Apply(p, row, slug); updated++; }
                else
                {
                    p = new Product { Id = nextId++, Slug = slug, NameEn = "", NameBn = "", DescriptionEn = "", DescriptionBn = "", ImageSrc = "" };
                    Apply(p, row, slug);
                    db.Products.Add(p);
                    created++;
                }
            }
            db.Audit(who, "product.import", "product", null, $"{created} created, {updated} updated");
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { created, updated });
        });

        // Photos: the browser shrinks the image first and sends it as base64 inside JSON (so it fits the normal proxy).
        app.MapPost("/api/admin/uploads", async Task<IResult> (UploadInput? input, System.Security.Claims.ClaimsPrincipal who, AppDbContext db, CancellationToken ct) =>
        {
            if (input?.Data is null) return AdminSupport.Invalid("data", "No image sent.");
            byte[] bytes;
            try { bytes = Convert.FromBase64String(input.Data); }
            catch (FormatException) { return AdminSupport.Invalid("data", "The image data is not valid."); }
            if (bytes.Length is 0 or > MaxImageBytes) return AdminSupport.Invalid("data", "Images must be under 1.5 MB. Choose a smaller photo.");

            // Trust the bytes, not the label: check the file really starts like a JPEG, PNG or WebP.
            var type = Sniff(bytes);
            if (type is null) return AdminSupport.Invalid("data", "Use a JPEG, PNG or WebP image.");

            var image = new ProductImage { ContentType = type, Data = bytes };
            db.ProductImages.Add(image);
            db.Audit(who, "image.upload", "image", image.Id.ToString(), $"{type}, {bytes.Length / 1024} KB");
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { id = image.Id, src = $"/api/bff/images/{image.Id}" });
        }).WithTags("Admin products").RequireAuthorization(Policies.Write);
    }

    private static string? Sniff(byte[] b) =>
        b.Length > 12 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF ? "image/jpeg" :
        b.Length > 8 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47 ? "image/png" :
        b.Length > 12 && b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46 && b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50 ? "image/webp" : null;

    private static string Slugify(string name, int id)
    {
        var s = Regex.Replace(name.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        return s.Length == 0 ? $"plant-{id}" : s[..Math.Min(s.Length, 90)];
    }

    private static void Apply(Product p, ProductInput i, string slug)
    {
        p.Slug = slug;
        p.NameEn = i.NameEn.Trim();
        p.NameBn = string.IsNullOrWhiteSpace(i.NameBn) ? p.NameEn : i.NameBn.Trim();   // Bangla is optional: fall back to English
        p.DescriptionEn = i.DescriptionEn.Trim();
        p.DescriptionBn = string.IsNullOrWhiteSpace(i.DescriptionBn) ? p.DescriptionEn : i.DescriptionBn.Trim();
        p.Category = i.Category;
        p.Price = Math.Round(i.Price, 2);
        p.Stock = i.Stock;
        p.Hidden = i.Hidden;
        p.Featured = i.Featured;
        p.NeedsReview = i.NeedsReview;
        p.ImageSrc = i.Image!.Src.Trim();
        p.ImageWidth = i.Image.Width;
        p.ImageHeight = i.Image.Height;
        p.Light = i.Care.Light;
        p.Water = i.Care.Water;
        p.Difficulty = i.Care.Difficulty;
        p.BonsaiStyle = i.Bonsai?.Style;
        p.BonsaiAgeYears = i.Bonsai?.AgeYears;
        p.BonsaiHeightCm = i.Bonsai?.HeightCm;
        p.BonsaiPlacement = i.Bonsai?.Placement;
        p.UpdatedAt = DateTime.UtcNow;
    }

    private static Dictionary<string, string[]> Validate(ProductInput? i)
    {
        var e = new Dictionary<string, string[]>();
        if (i is null) { e["product"] = ["Missing product."]; return e; }
        if (i.NameEn is null || i.NameEn.Trim().Length is < 2 or > 150) e["nameEn"] = ["Enter the English name (2–150 characters)."];
        if (i.NameBn?.Length > 150) e["nameBn"] = ["The Bangla name is too long."];
        if (i.DescriptionEn is null || i.DescriptionEn.Trim().Length is < 10 or > 1500) e["descriptionEn"] = ["Write a description (10–1500 characters)."];
        if (i.DescriptionBn?.Length > 1500) e["descriptionBn"] = ["The Bangla description is too long."];
        if (i.Price is < 1 or > 1_000_000) e["price"] = ["Price must be between ৳1 and ৳1,000,000."];
        if (i.Stock is < 0 or > 100_000) e["stock"] = ["Stock must be 0–100,000 (or empty to not track it)."];
        if (i.Slug is { Length: > 0 } slug && (slug.Length > 100 || !SlugRx().IsMatch(slug.Trim()))) e["slug"] = ["Use lowercase letters, numbers and hyphens only."];
        if (!Enum.IsDefined(i.Category)) e["category"] = ["Choose a category."];
        if (i.Image is null || string.IsNullOrWhiteSpace(i.Image.Src) || i.Image.Src.Length > 500
            || !(i.Image.Src.StartsWith('/') || i.Image.Src.StartsWith("https://")) || i.Image.Src.StartsWith("//"))
            e["image"] = ["Add a photo."];
        else if (i.Image.Width is < 1 or > 10000 || i.Image.Height is < 1 or > 10000) e["image"] = ["The photo size is not valid."];
        if (i.Care is null || !Enum.IsDefined(i.Care.Light) || !Enum.IsDefined(i.Care.Water) || !Enum.IsDefined(i.Care.Difficulty)) e["care"] = ["Choose the care details."];
        if (i.Bonsai is { } b && (b.AgeYears is < 0 or > 500 || b.HeightCm is < 1 or > 500 || !Enum.IsDefined(b.Style) || !Enum.IsDefined(b.Placement)))
            e["bonsai"] = ["Check the bonsai details (age 0–500, height 1–500 cm)."];
        return e;
    }
}
