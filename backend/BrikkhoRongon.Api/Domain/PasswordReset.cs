namespace BrikkhoRongon.Api.Domain;

/// <summary>
/// A "forgot password" request. Only a hash of the secret is stored, so a leaked database can't be used to reset anyone's password.
/// The secret works once, for one hour.
/// </summary>
public class PasswordReset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public required string TokenHash { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
}
