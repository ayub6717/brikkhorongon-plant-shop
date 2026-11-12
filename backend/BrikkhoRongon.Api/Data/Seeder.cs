using System.Text.Json;
using System.Text.Json.Serialization;
using BrikkhoRongon.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Data;

/// <summary>Fills an empty database with the 41 plants from the storefront catalog.</summary>
public static class Seeder
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }, // case-insensitive: "formalUpright" -> FormalUpright
    };

    public static async Task SeedRolesAsync(RoleManager<IdentityRole> roles)
    {
        foreach (var name in new[] { Roles.Admin, Roles.Customer })
            if (!await roles.RoleExistsAsync(name))
                await roles.CreateAsync(new IdentityRole(name));
    }

    /// <summary>
    /// Development convenience: creates the shop-team (Admin) account if Admin:Email and Admin:Password are set
    /// in user-secrets. Nothing is created when they are absent.
    /// </summary>
    public static async Task SeedAdminAsync(UserManager<AppUser> users, IConfiguration config)
    {
        var email = config["Admin:Email"];
        var password = config["Admin:Password"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password)) return;

        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            user = new AppUser { UserName = email, Email = email, FullName = "Shop Admin" };
            var created = await users.CreateAsync(user, password);
            if (!created.Succeeded)
                throw new InvalidOperationException("Could not create the admin: " + string.Join("; ", created.Errors.Select(e => e.Description)));
        }
        if (!await users.IsInRoleAsync(user, Roles.Admin)) await users.AddToRoleAsync(user, Roles.Admin);
    }

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Products.AnyAsync(ct)) return;

        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "products.json");
        await using var stream = File.OpenRead(path);
        var products = await JsonSerializer.DeserializeAsync<List<Product>>(stream, Json, ct)
            ?? throw new InvalidOperationException("products.json is empty.");

        db.Products.AddRange(products);
        await db.SaveChangesAsync(ct);
    }
}
