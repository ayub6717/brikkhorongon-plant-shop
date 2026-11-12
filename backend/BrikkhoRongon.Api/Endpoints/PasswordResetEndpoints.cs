using System.Net;
using System.Security.Cryptography;
using System.Text;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using BrikkhoRongon.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Endpoints;

public record ForgotPasswordRequest(string? Email, string? Locale);
public record ResetPasswordRequest(string? Email, string? Token, string? Password);

/// <summary>
/// "I forgot my password" for everyone (customers and the shop team alike).
/// The first call always answers the same way, whether or not the email has an account, so it can't be used to find out who is registered.
/// </summary>
public static class PasswordResetEndpoints
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);

    private static string Hash(string secret) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(secret)));

    private static string SiteUrl(IConfiguration c) =>
        (c["Site:Url"] ?? c.GetSection("Cors:Origins").Get<string[]>()?.FirstOrDefault() ?? "http://localhost:3000").TrimEnd('/');

    public static void MapPasswordReset(this WebApplication app)
    {
        var g = app.MapGroup("/api/auth").WithTags("Auth").RequireRateLimiting("auth");

        g.MapPost("/forgot-password", async Task<IResult> (ForgotPasswordRequest? r, UserManager<AppUser> users, AppDbContext db, IMailer mail, IConfiguration config, ILoggerFactory logs, CancellationToken ct) =>
        {
            var email = r?.Email?.Trim();
            if (string.IsNullOrEmpty(email) || email.Length > 254) return Results.NoContent();

            var user = await users.FindByEmailAsync(email);
            if (user?.Email is null) return Results.NoContent();

            var now = DateTime.UtcNow;
            // One email a minute per account, so the form can't be used to flood someone's inbox.
            if (await db.PasswordResets.AnyAsync(x => x.UserId == user.Id && x.CreatedAt > now.AddMinutes(-1), ct)) return Results.NoContent();

            var secret = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
            await db.PasswordResets.Where(x => x.UserId == user.Id && x.UsedAt == null).ExecuteDeleteAsync(ct); // older links stop working
            db.PasswordResets.Add(new PasswordReset { UserId = user.Id, TokenHash = Hash(secret), ExpiresAt = now.Add(Lifetime) });
            await db.SaveChangesAsync(ct);

            var bn = r?.Locale == "bn";
            var link = $"{SiteUrl(config)}{(bn ? "/bn" : "")}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={secret}";
            var (subject, text, html) = Compose(bn, user.FullName, link);
            try { await mail.SendAsync(user.Email, subject, html, text, ct); }
            catch (Exception e) { logs.CreateLogger("PasswordReset").LogWarning(e, "Could not send the reset email."); }
            return Results.NoContent();
        });

        g.MapPost("/reset-password", async Task<IResult> (ResetPasswordRequest? r, UserManager<AppUser> users, AppDbContext db, CancellationToken ct) =>
        {
            const string invalid = "This link is invalid or has expired. Ask for a new one.";
            if (r is null || string.IsNullOrWhiteSpace(r.Email) || string.IsNullOrEmpty(r.Token))
                return AdminSupport.Problem(StatusCodes.Status400BadRequest, "INVALID_RESET_TOKEN", invalid);
            if (r.Password is null || r.Password.Length < 8) return AdminSupport.Invalid("password", "Use at least 8 characters.");

            var user = await users.FindByEmailAsync(r.Email.Trim());
            var hash = Hash(r.Token);
            var now = DateTime.UtcNow;
            var row = user is null ? null : await db.PasswordResets.FirstOrDefaultAsync(x => x.UserId == user.Id && x.TokenHash == hash && x.UsedAt == null && x.ExpiresAt > now, ct);
            if (user is null || row is null) return AdminSupport.Problem(StatusCodes.Status400BadRequest, "INVALID_RESET_TOKEN", invalid);

            // The secret was proven above; Identity's own token is made and used inside this one request, so it needs no stored keys.
            var result = await users.ResetPasswordAsync(user, await users.GeneratePasswordResetTokenAsync(user), r.Password);
            if (!result.Succeeded)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["password"] = [.. result.Errors.Select(e => e.Description)] });

            row.UsedAt = now;
            await db.SaveChangesAsync(ct);
            await db.PasswordResets.Where(x => x.UserId == user.Id && x.UsedAt == null).ExecuteDeleteAsync(ct);
            await users.SetLockoutEndDateAsync(user, null);   // a locked-out customer can come back in with the new password
            await users.ResetAccessFailedCountAsync(user);
            return Results.NoContent();
        });
    }

    private static (string Subject, string Text, string Html) Compose(bool bn, string name, string link)
    {
        var safe = WebUtility.HtmlEncode(link);
        var who = WebUtility.HtmlEncode(name);
        if (bn)
            return ("আপনার বৃক্ষরঙ্গন পাসওয়ার্ড রিসেট করুন",
                $"হ্যালো {name},\n\nনতুন পাসওয়ার্ড দিতে এই লিংকে যান (১ ঘণ্টা কাজ করবে):\n{link}\n\nআপনি অনুরোধ না করে থাকলে এই ইমেল উপেক্ষা করুন; আপনার পাসওয়ার্ড বদলাবে না।",
                $"<p>হ্যালো {who},</p><p>নতুন পাসওয়ার্ড দিতে <a href=\"{safe}\">এখানে ক্লিক করুন</a> (লিংকটি ১ ঘণ্টা কাজ করবে)।</p><p>আপনি অনুরোধ না করে থাকলে এই ইমেল উপেক্ষা করুন; আপনার পাসওয়ার্ড বদলাবে না।</p>");
        return ("Reset your Brikkhorongon password",
            $"Hello {name},\n\nUse this link to choose a new password (it works for 1 hour):\n{link}\n\nIf you didn't ask for this, ignore this email. Your password won't change.",
            $"<p>Hello {who},</p><p><a href=\"{safe}\">Choose a new password</a> (the link works for 1 hour).</p><p>If you didn't ask for this, ignore this email. Your password won't change.</p>");
    }
}
