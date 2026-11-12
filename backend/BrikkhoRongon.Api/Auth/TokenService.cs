using System.Security.Claims;
using System.Text;
using BrikkhoRongon.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace BrikkhoRongon.Api.Auth;

/// <summary>Creates the signed token (JWT) that proves "this request comes from user X with roles Y".</summary>
public class TokenService(IOptions<JwtOptions> options)
{
    public (string Token, DateTime ExpiresAt) Create(AppUser user, IEnumerable<string> roles)
    {
        var o = options.Value;
        var expires = DateTime.UtcNow.AddMinutes(o.ExpiryMinutes);

        var claims = new List<Claim>
        {
            new("sub", user.Id),
            new("email", user.Email ?? ""),
            new("name", user.FullName),
        };
        claims.AddRange(roles.Select(r => new Claim("role", r)));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = o.Issuer,
            Audience = o.Audience,
            Expires = expires,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(o.Key)), SecurityAlgorithms.HmacSha256),
        };

        return (new JsonWebTokenHandler().CreateToken(descriptor), expires);
    }
}
