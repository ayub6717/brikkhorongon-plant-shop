using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.RegularExpressions;
using BrikkhoRongon.Api.Auth;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

public record RegisterRequest(string Name, string Email, string Phone, string Password);
public record LoginRequest(string Email, string Password);
public record UpdateProfileRequest(string Name, string Phone);
public record AddressRequest(string Label, string District, string Area, string Address);

public record AddressDto(Guid Id, string Label, string District, string Area, string Address);
public record UserDto(string Id, string Name, string Email, string Phone, string[] Roles, DateTime CreatedAt, AddressDto[] Addresses);
public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);

public static partial class AuthEndpoints
{
    // Same rules as the storefront (src/lib/shipping.ts and checkout-schema.ts). The server re-checks everything:
    // the browser's checks are only for convenience, never for safety.
    private static readonly string[] Districts = ["dhaka", "chattogram", "sylhet", "rajshahi", "khulna", "barishal", "rangpur", "mymensingh", "other"];
    private const int MaxAddresses = 10;

    [GeneratedRegex(@"^(?:\+?88)?01[3-9]\d{8}$")]
    private static partial Regex BdPhone();

    public static void MapAuth(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth").WithTags("Auth").RequireRateLimiting("auth");

        g.MapPost("/register", async Task<IResult> (RegisterRequest r, UserManager<AppUser> users, AppDbContext db, TokenService tokens) =>
        {
            var errors = new Dictionary<string, string[]>();
            if (r.Name is null || r.Name.Trim().Length is < 2 or > 80) errors["name"] = ["Enter your name (2–80 characters)."];
            if (!IsEmail(r.Email)) errors["email"] = ["Enter a valid email address."];
            if (r.Phone is null || !BdPhone().IsMatch(r.Phone.Trim())) errors["phone"] = ["Enter a valid Bangladeshi mobile number."];
            if (r.Password is null || r.Password.Length < 8) errors["password"] = ["Use at least 8 characters."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var email = r.Email.Trim();
            var user = new AppUser { UserName = email, Email = email, FullName = r.Name.Trim(), PhoneNumber = r.Phone.Trim() };
            var created = await users.CreateAsync(user, r.Password);
            if (!created.Succeeded)
            {
                if (created.Errors.Any(e => e.Code is "DuplicateUserName" or "DuplicateEmail"))
                    return Problem(StatusCodes.Status409Conflict, "EMAIL_TAKEN", "An account with this email already exists.");
                return Results.ValidationProblem(created.Errors
                    .GroupBy(e => e.Code.Contains("Password") ? "password" : "account")
                    .ToDictionary(x => x.Key, x => x.Select(e => e.Description).ToArray()));
            }

            await users.AddToRoleAsync(user, Roles.Customer);
            return Results.Ok(await BuildAuthAsync(user, users, db, tokens));
        });

        g.MapPost("/login", async Task<IResult> (LoginRequest r, UserManager<AppUser> users, AppDbContext db, TokenService tokens) =>
        {
            if (string.IsNullOrWhiteSpace(r.Email) || string.IsNullOrEmpty(r.Password))
                return Problem(StatusCodes.Status401Unauthorized, "INVALID_CREDENTIALS", "Email or password is wrong.");

            var user = await users.FindByEmailAsync(r.Email.Trim());
            // Same answer for "no such email" and "wrong password", so nobody can probe which emails have accounts.
            if (user is null) return Problem(StatusCodes.Status401Unauthorized, "INVALID_CREDENTIALS", "Email or password is wrong.");

            if (await users.IsLockedOutAsync(user))
                return Problem(StatusCodes.Status423Locked, "LOCKED_OUT", "Too many wrong attempts. Try again in 15 minutes.");

            if (!await users.CheckPasswordAsync(user, r.Password))
            {
                await users.AccessFailedAsync(user); // 5 failures lock the account for 15 minutes
                return Problem(StatusCodes.Status401Unauthorized, "INVALID_CREDENTIALS", "Email or password is wrong.");
            }

            await users.ResetAccessFailedCountAsync(user);
            return Results.Ok(await BuildAuthAsync(user, users, db, tokens));
        });

        // Everything below needs a valid token.
        var me = app.MapGroup("/api/me").WithTags("Account").RequireAuthorization();

        me.MapGet("/", async Task<IResult> (ClaimsPrincipal principal, UserManager<AppUser> users, AppDbContext db) =>
            await CurrentAsync(principal, users) is { } user ? Results.Ok(await ToDtoAsync(user, users, db)) : Results.Unauthorized());

        me.MapPut("/", async Task<IResult> (UpdateProfileRequest r, ClaimsPrincipal principal, UserManager<AppUser> users, AppDbContext db) =>
        {
            if (await CurrentAsync(principal, users) is not { } user) return Results.Unauthorized();
            var errors = new Dictionary<string, string[]>();
            if (r.Name is null || r.Name.Trim().Length is < 2 or > 80) errors["name"] = ["Enter your name (2–80 characters)."];
            if (r.Phone is null || !BdPhone().IsMatch(r.Phone.Trim())) errors["phone"] = ["Enter a valid Bangladeshi mobile number."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            user.FullName = r.Name.Trim();
            user.PhoneNumber = r.Phone.Trim();
            await users.UpdateAsync(user);
            return Results.Ok(await ToDtoAsync(user, users, db));
        });

        me.MapPost("/addresses", async Task<IResult> (AddressRequest r, ClaimsPrincipal principal, UserManager<AppUser> users, AppDbContext db) =>
        {
            if (await CurrentAsync(principal, users) is not { } user) return Results.Unauthorized();
            var errors = new Dictionary<string, string[]>();
            if (r.Label is null || r.Label.Trim().Length is < 2 or > 30) errors["label"] = ["Give it a short label (2–30 characters)."];
            if (r.District is null || !Districts.Contains(r.District)) errors["district"] = ["Choose a district."];
            if (r.Area is null || r.Area.Trim().Length is < 2 or > 100) errors["area"] = ["Enter the area."];
            if (r.Address is null || r.Address.Trim().Length is < 5 or > 200) errors["address"] = ["Enter the full address."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            if (await db.Addresses.CountAsync(a => a.UserId == user.Id) >= MaxAddresses)
                return Problem(StatusCodes.Status400BadRequest, "TOO_MANY_ADDRESSES", $"You can save up to {MaxAddresses} addresses.");

            db.Addresses.Add(new Address { UserId = user.Id, Label = r.Label.Trim(), District = r.District, Area = r.Area.Trim(), Line = r.Address.Trim() });
            await db.SaveChangesAsync();
            return Results.Ok(await ToDtoAsync(user, users, db));
        });

        me.MapDelete("/addresses/{id:guid}", async Task<IResult> (Guid id, ClaimsPrincipal principal, UserManager<AppUser> users, AppDbContext db) =>
        {
            if (await CurrentAsync(principal, users) is not { } user) return Results.Unauthorized();
            // Filtering by UserId means you can only ever delete your own addresses.
            var address = await db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == user.Id);
            if (address is not null)
            {
                db.Addresses.Remove(address);
                await db.SaveChangesAsync();
            }
            return Results.Ok(await ToDtoAsync(user, users, db));
        });
    }

    private static IResult Problem(int status, string code, string title) =>
        Results.Problem(statusCode: status, title: title, extensions: new Dictionary<string, object?> { ["code"] = code });

    private static bool IsEmail(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Length <= 254 && new EmailAddressAttribute().IsValid(value.Trim());

    private static Task<AppUser?> CurrentAsync(ClaimsPrincipal principal, UserManager<AppUser> users) =>
        principal.FindFirstValue("sub") is { } id ? users.FindByIdAsync(id) : Task.FromResult<AppUser?>(null);

    private static async Task<AuthResponse> BuildAuthAsync(AppUser user, UserManager<AppUser> users, AppDbContext db, TokenService tokens)
    {
        var roles = await users.GetRolesAsync(user);
        var (token, expires) = tokens.Create(user, roles);
        return new AuthResponse(token, expires, await ToDtoAsync(user, users, db));
    }

    private static async Task<UserDto> ToDtoAsync(AppUser user, UserManager<AppUser> users, AppDbContext db)
    {
        var roles = await users.GetRolesAsync(user);
        var addresses = await db.Addresses.AsNoTracking()
            .Where(a => a.UserId == user.Id).OrderBy(a => a.CreatedAt)
            .Select(a => new AddressDto(a.Id, a.Label, a.District, a.Area, a.Line))
            .ToArrayAsync();
        return new UserDto(user.Id, user.FullName, user.Email ?? "", user.PhoneNumber ?? "", [.. roles], user.CreatedAt, addresses);
    }
}
