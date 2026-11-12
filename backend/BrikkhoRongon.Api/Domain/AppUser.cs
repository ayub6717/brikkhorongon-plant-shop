using Microsoft.AspNetCore.Identity;

namespace BrikkhoRongon.Api.Domain;

/// <summary>
/// A shop account. Identity gives us the hard parts for free: password hashing, lockout after repeated
/// wrong passwords, unique emails. We never store or see a plain-text password.
/// (The mobile number lives in the built-in PhoneNumber property.)
/// </summary>
public class AppUser : IdentityUser
{
    public string FullName { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public static class Roles
{
    public const string Admin = "Admin";
    public const string Customer = "Customer";
}
