namespace BrikkhoRongon.Api.Domain;

public enum Category { Indoor, Calathea, Dracaena, Ficus, Orchids, Bonsai }
public enum Light { Low, Medium, Bright }
public enum Water { Low, Moderate, High }
public enum Difficulty { Easy, Moderate }
public enum BonsaiStyle { FormalUpright, InformalUpright, Windswept, SemiCascade, Literati, Broom }
public enum Placement { Indoor, Outdoor }

/// <summary>One plant in the catalog. Maps to the "products" table.</summary>
public class Product
{
    public int Id { get; set; }
    public required string Slug { get; set; }
    public Category Category { get; set; }

    /// <summary>Price in BDT. Money is always decimal, never double.</summary>
    public decimal Price { get; set; }

    public required string NameEn { get; set; }
    public required string NameBn { get; set; }
    public required string DescriptionEn { get; set; }
    public required string DescriptionBn { get; set; }

    public required string ImageSrc { get; set; }
    public int ImageWidth { get; set; }
    public int ImageHeight { get; set; }

    public Light Light { get; set; }
    public Water Water { get; set; }
    public Difficulty Difficulty { get; set; }

    public bool Featured { get; set; }
    /// <summary>Legacy data that should be double-checked before launch.</summary>
    public bool NeedsReview { get; set; }

    // Only set for bonsai trees.
    public BonsaiStyle? BonsaiStyle { get; set; }
    public int? BonsaiAgeYears { get; set; }
    public int? BonsaiHeightCm { get; set; }
    public Placement? BonsaiPlacement { get; set; }
}
