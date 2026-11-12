namespace BrikkhoRongon.Api.Domain;

/// <summary>A saved delivery address that belongs to one user.</summary>
public class Address
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public required string Label { get; set; }
    public required string District { get; set; }
    public required string Area { get; set; }
    public required string Line { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
