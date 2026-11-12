namespace BrikkhoRongon.Api.Domain;

/// <summary>A customer's review of one plant. Only signed-in customers can write one, and only one per plant.</summary>
public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Slug { get; set; }
    public required string UserId { get; set; }
    public required string AuthorName { get; set; }
    public int Rating { get; set; }
    public string Title { get; set; } = "";
    public required string Text { get; set; }
    /// <summary>True when the author has a delivered order containing this plant. Shown as a "Verified purchase" badge.</summary>
    public bool VerifiedPurchase { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
