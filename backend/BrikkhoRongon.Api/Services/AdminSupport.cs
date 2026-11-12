using System.Security.Claims;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Services;

/// <summary>Small helpers shared by the admin endpoints.</summary>
public static class AdminSupport
{
    /// <summary>Records "who did what" in the same save as the change itself, so the two can never disagree.</summary>
    public static void Audit(this AppDbContext db, ClaimsPrincipal who, string action, string entity, string? id = null, string? detail = null) =>
        db.AuditLog.Add(new AuditEntry
        {
            ActorId = who.FindFirstValue("sub") ?? "",
            ActorEmail = who.FindFirstValue("email") ?? "",
            Action = action, Entity = entity, EntityId = id,
            Detail = detail is { Length: > 1000 } ? detail[..1000] : detail,
        });

    /// <summary>The single settings row. Created with the defaults the first time it is needed.</summary>
    public static async Task<ShopSettings> GetSettingsAsync(this AppDbContext db, CancellationToken ct = default)
    {
        var s = await db.Settings.FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (s is not null) return s;
        s = new ShopSettings();
        db.Settings.Add(s);
        await db.SaveChangesAsync(ct);
        return s;
    }

    public static ShippingRules Rules(this ShopSettings s) => new(s.FreeShippingThreshold, s.DhakaInnerFee, s.DhakaOuterFee, s.DistrictFees);

    public static string[] SlotList(this ShopSettings s) =>
        [.. s.Slots.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Where(Pricing.Slots.Contains)];

    public static Coupon ToCoupon(this PromoCode c) => new(c.Code, c.Kind, c.Value, c.MinSubtotal, c.ExpiresAt, c.UsageLimit, c.Used);

    public static IResult Problem(int status, string code, string title) =>
        Results.Problem(statusCode: status, title: title, extensions: new Dictionary<string, object?> { ["code"] = code });

    public static IResult Invalid(string field, string message) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });

    /// <summary>Bangladesh calendar day (YYYY-MM-DD) to the UTC instant that day starts at (Bangladesh is UTC+6).</summary>
    public static DateTime? DayStartUtc(string? day) =>
        DateOnly.TryParseExact(day, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var d)
            ? DateTime.SpecifyKind(d.ToDateTime(TimeOnly.MinValue).AddHours(-6), DateTimeKind.Utc) : null;

    public static string ToCamel(string s) => s.Length == 0 ? s : char.ToLowerInvariant(s[0]) + s[1..];
}
