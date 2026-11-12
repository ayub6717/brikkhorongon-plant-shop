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

/// <summary>
/// Who can do what. Admin is the shop owner (everything). Manager runs the shop day to day. Viewer can look but not touch.
/// Delivery staff only see orders and move them along. Customer is every normal shopper.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Viewer = "Viewer";
    public const string Delivery = "Delivery";
    public const string Customer = "Customer";

    public static readonly string[] Staff = [Admin, Manager, Viewer, Delivery];
    public static readonly string[] All = [Admin, Manager, Viewer, Delivery, Customer];
}
