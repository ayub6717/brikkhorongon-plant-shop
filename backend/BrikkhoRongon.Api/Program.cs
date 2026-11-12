using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using BrikkhoRongon.Api.Auth;
using BrikkhoRongon.Api.Data;
using BrikkhoRongon.Api.Domain;
using BrikkhoRongon.Api.Endpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// The connection string (with the password) lives in user-secrets locally and in an environment variable in production.
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default is not set. See backend/README.md.")));

// ---- Accounts: Identity (users, password hashing, roles) ----
builder.Services
    .AddIdentityCore<AppUser>(o =>
    {
        o.User.RequireUniqueEmail = true;
        o.Password.RequiredLength = 8;          // length matters more than symbols
        o.Password.RequireNonAlphanumeric = false;
        o.Password.RequireUppercase = false;
        o.Lockout.MaxFailedAccessAttempts = 5;  // 5 wrong passwords...
        o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15); // ...lock the account for 15 minutes
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

// ---- Sign-in token (JWT) ----
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt:Key is missing or too short (needs 32+ characters). See backend/README.md.");
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<TokenService>();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        // Keep claim names exactly as written in the token ("sub", "role"). Without this, .NET renames "sub"
        // to a long XML-style name and our code would not find the user id.
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "name",
            RoleClaimType = "role",
        };
    });
builder.Services.AddAuthorization();

// Brute-force guard: each IP address may call the sign-in/sign-up endpoints 10 times a minute.
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("auth", ctx => PerIp(ctx, 10));
    o.AddPolicy("orders", ctx => PerIp(ctx, 60)); // checkout, tracking and change requests
    static RateLimitPartition<string> PerIp(HttpContext ctx, int perMinute) => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = perMinute, Window = TimeSpan.FromMinutes(1) });
});

// Enums travel as camelCase text ("informalUpright") to match the storefront's types.
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull; // absent, not null
});

builder.Services.AddProblemDetails(); // errors come back as RFC 9457 JSON, not HTML
builder.Services.AddOpenApi();

var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddPolicy("web", p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// The storefront server forwards the visitor's address in X-Forwarded-For so rate limiting counts real visitors.
// Only trusted proxies (by default: this machine) are believed; configure KnownProxies before deploying.
app.UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.XForwardedFor });
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors("web");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                 // /openapi/v1.json
    app.MapScalarApiReference();      // /scalar/v1  (a page where you can try the endpoints)
    app.UseSwaggerUI(o => o.SwaggerEndpoint("/openapi/v1.json", "BrikkhoRongon API v1")); // /swagger

    // Convenience for local work: create/upgrade tables, create the roles, load the catalog.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await Seeder.SeedRolesAsync(scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>());
    await Seeder.SeedAsync(db);
    await Seeder.SeedAdminAsync(scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>(), builder.Configuration);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).ExcludeFromDescription();
app.MapCatalog();
app.MapAuth();
app.MapOrders();
app.MapAdmin();
app.MapReviews();

app.Run();
