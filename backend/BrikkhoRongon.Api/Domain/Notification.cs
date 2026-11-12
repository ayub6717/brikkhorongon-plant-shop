namespace BrikkhoRongon.Api.Domain;

/// <summary>
/// A message in a customer's account ("your order was delivered"). Only a kind and an order number are stored;
/// the website writes the sentence itself, in the reader's language.
/// </summary>
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    /// <summary>order.packed | order.shipped | order.outForDelivery | order.delivered | order.cancelled | order.refunded | request.approved | request.declined</summary>
    public required string Kind { get; set; }
    public string? OrderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
}
