namespace BrikkhoRongon.Api.Auth;

/// <summary>Settings for the sign-in token. The secret Key comes from user-secrets / environment, never from git.</summary>
public class JwtOptions
{
    public string Issuer { get; set; } = "brikkhorongon-api";
    public string Audience { get; set; } = "brikkhorongon-web";
    public string Key { get; set; } = "";
    public int ExpiryMinutes { get; set; } = 60;
}
