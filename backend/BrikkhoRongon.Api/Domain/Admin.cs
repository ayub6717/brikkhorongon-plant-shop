namespace BrikkhoRongon.Api.Domain;

/// <summary>A promo code. Replaces the hard-coded demo list: the shop team creates and ends these from the admin.</summary>
public class PromoCode
{
    public required string Code { get; set; }
    /// <summary>percent | fixed | freeShip</summary>
    public required string Kind { get; set; }
    public int Value { get; set; }
    public int MinSubtotal { get; set; }
    public DateTime? ExpiresAt { get; set; }
    /// <summary>How many orders may use it in total. null = unlimited.</summary>
    public int? UsageLimit { get; set; }
    public int Used { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>The shop's adjustable rules. A single row (Id = 1).</summary>
public class ShopSettings
{
    public int Id { get; set; } = 1;
    public decimal FreeShippingThreshold { get; set; } = 3000;
    public decimal DhakaInnerFee { get; set; } = 60;
    public decimal DhakaOuterFee { get; set; } = 100;
    /// <summary>Flat fee per district outside Dhaka, as JSON text: {"chattogram":120,...}.</summary>
    public Dictionary<string, decimal> DistrictFees { get; set; } = new()
    {
        ["chattogram"] = 120, ["mymensingh"] = 120, ["sylhet"] = 130, ["rajshahi"] = 130,
        ["khulna"] = 130, ["barishal"] = 140, ["rangpur"] = 140, ["other"] = 150,
    };
    /// <summary>Delivery slots that customers may choose, comma separated.</summary>
    public string Slots { get; set; } = "morning,afternoon,evening";
    public int LowStockAt { get; set; } = 5;
    public string ShopName { get; set; } = "Brikkhorongon";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Address { get; set; } = "";
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>"Who did what, when": one row per change made in the admin.</summary>
public class AuditEntry
{
    public long Id { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
    public string ActorId { get; set; } = "";
    public string ActorEmail { get; set; } = "";
    public required string Action { get; set; }
    public required string Entity { get; set; }
    public string? EntityId { get; set; }
    public string? Detail { get; set; }
}

/// <summary>An uploaded product photo, stored in the database (the host's disk is wiped on every deploy).</summary>
public class ProductImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string ContentType { get; set; }
    public required byte[] Data { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
