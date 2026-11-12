namespace BrikkhoRongon.Api.Services;

public record Coupon(string Code, string Kind, int Value, int MinSubtotal, DateTime? ExpiresAt = null, int? UsageLimit = null, int Used = 0);
public record ShippingRules(decimal FreeThreshold, decimal DhakaInner, decimal DhakaOuter, IReadOnlyDictionary<string, decimal> DistrictFees);
public record Totals(decimal Subtotal, decimal Discount, decimal Shipping, decimal Total, string? CouponCode, string? CouponProblem);

/// <summary>
/// The money rules, ported 1:1 from the storefront (src/lib/coupons.ts, shipping.ts, totals.ts).
/// The server is the only place that decides what an order costs.
/// </summary>
public static class Pricing
{
    // DEMO campaigns. Replace with real ones (ideally stored in the database) before launch.
    public static readonly Coupon[] DefaultCoupons =
    [
        new("WELCOME10", "percent", 10, 500),
        new("PLANT100", "fixed", 100, 1500),
        new("FREESHIP", "freeShip", 0, 1000),
    ];

    /// <summary>Used when no settings are passed in (tests, first start). The real values live in the shop_settings table.</summary>
    public static readonly ShippingRules DefaultRules = new(3000, 60, 100, new Dictionary<string, decimal>
    {
        ["chattogram"] = 120, ["mymensingh"] = 120, ["sylhet"] = 130, ["rajshahi"] = 130,
        ["khulna"] = 130, ["barishal"] = 140, ["rangpur"] = 140, ["other"] = 150,
    });

    public static readonly string[] Districts = ["dhaka", "chattogram", "sylhet", "rajshahi", "khulna", "barishal", "rangpur", "mymensingh", "other"];
    public static readonly string[] Slots = ["morning", "afternoon", "evening"];
    public static readonly string[] Payments = ["cod", "bkash", "card"];
    public static readonly string[] GiftCards = ["none", "leaf", "bloom", "sunrise"];
    public static readonly string[] Pots = ["terracotta", "whiteCeramic", "cement", "woven", "none"];

    private static readonly string[] InnerDhakaAreas =
    [
        "mirpur", "dhanmondi", "gulshan", "banani", "uttara", "mohammadpur", "bashundhara", "badda", "motijheel", "khilgaon",
        "tejgaon", "farmgate", "mohakhali", "malibagh", "rampura", "shyamoli", "lalmatia", "baridhara", "niketan", "wari",
        "paltan", "shantinagar", "jatrabari", "old dhaka", "shahbag", "kalabagan", "kawran bazar", "mogbazar",
        "মিরপুর", "ধানমন্ডি", "গুলশান", "বনানী", "উত্তরা", "মোহাম্মদপুর", "বসুন্ধরা", "বাড্ডা", "মতিঝিল", "খিলগাঁও",
        "তেজগাঁও", "ফার্মগেট", "মহাখালী", "মালিবাগ", "রামপুরা", "শ্যামলী", "লালমাটিয়া", "বারিধারা", "নিকেতন", "ওয়ারী",
        "পল্টন", "শান্তিনগর", "যাত্রাবাড়ী", "শাহবাগ", "কলাবাগান",
    ];

    private static bool IsInnerDhaka(string area)
    {
        var a = area.Trim().ToLowerInvariant();
        return a.Length > 0 && InnerDhakaAreas.Any(x => a.Contains(x));
    }

    public static decimal Shipping(decimal subtotal, string district, string area, ShippingRules? rules = null)
    {
        var r = rules ?? DefaultRules;
        if (subtotal <= 0 || subtotal >= r.FreeThreshold) return 0;
        if (district == "dhaka") return string.IsNullOrWhiteSpace(area) || IsInnerDhaka(area) ? r.DhakaInner : r.DhakaOuter;
        return r.DistrictFees.TryGetValue(district, out var fee) ? fee : r.DistrictFees.GetValueOrDefault("other", 150);
    }

    public static Totals Compute(decimal subtotal, string? couponCode, string district, string area,
        IEnumerable<Coupon>? coupons = null, ShippingRules? rules = null, DateTime? now = null)
    {
        decimal discount = 0;
        string? applied = null, problem = null;
        var freeShip = false;

        var wanted = couponCode?.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(wanted))
        {
            var coupon = (coupons ?? DefaultCoupons).FirstOrDefault(c => c.Code == wanted);
            if (coupon is null) problem = "COUPON_UNKNOWN";
            else if (coupon.ExpiresAt is { } end && end <= (now ?? DateTime.UtcNow)) problem = "COUPON_EXPIRED";
            else if (coupon.UsageLimit is { } limit && coupon.Used >= limit) problem = "COUPON_USED_UP";
            else if (subtotal < coupon.MinSubtotal) problem = "COUPON_MIN";
            else
            {
                applied = coupon.Code;
                var raw = coupon.Kind switch
                {
                    "percent" => Math.Round(subtotal * coupon.Value / 100, MidpointRounding.AwayFromZero),
                    "fixed" => coupon.Value,
                    _ => 0,
                };
                discount = Math.Min(raw, subtotal);
                freeShip = coupon.Kind == "freeShip";
            }
        }

        var shipping = freeShip ? 0 : Shipping(subtotal - discount, district, area, rules);
        return new Totals(subtotal, discount, shipping, subtotal - discount + shipping, applied, problem);
    }
}
