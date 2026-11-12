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
    o.UseNpgsql(ConnectionStrings.Normalize(builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default is not set. See backend/README.md."))));

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
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// ---- Email: Resend when Resend:ApiKey is set, otherwise a stand-in that only logs (see Services/Mailer.cs) ----
if (!string.IsNullOrWhiteSpace(builder.Configuration["Resend:ApiKey"]))
    builder.Services.AddHttpClient<BrikkhoRongon.Api.Services.IMailer, BrikkhoRongon.Api.Services.ResendMailer>(c => c.Timeout = TimeSpan.FromSeconds(10));
else
    builder.Services.AddSingleton<BrikkhoRongon.Api.Services.IMailer, BrikkhoRongon.Api.Services.LogMailer>();

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
builder.Services.AddAuthorization(Policies.Add);

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
// Locally only this machine is believed. On a host such as Render the connection arrives from the host's own proxy,
// whose address we cannot know in advance, so production sets ForwardedHeaders__TrustAll=true. The proxy appends the
// caller's address to the list, so ForwardedHeaders__Limit=2 makes us read the address the storefront reported
// (the second from the end) instead of the proxy's own.
var forwarded = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor,
    ForwardLimit = builder.Configuration.GetValue("ForwardedHeaders:Limit", 1),
};
if (builder.Configuration.GetValue("ForwardedHeaders:TrustAll", false))
{
    forwarded.KnownIPNetworks.Clear();
    forwarded.KnownProxies.Clear();
}
app.UseForwardedHeaders(forwarded);
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

}

// On start: create/upgrade the tables, create the roles, load the catalog, and create the admin account when
// Admin:Email / Admin:Password are provided (secrets locally; environment variables on the host). Fine for a
// single-instance demo; a bigger system would run migrations as a separate deploy step.
if (app.Configuration.GetValue("Database:AutoMigrate", true))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await Seeder.SeedRolesAsync(scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>());
    await Seeder.SeedAsync(db);
    await Seeder.SeedShopAsync(db);
    await Seeder.SeedAdminAsync(scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>(), builder.Configuration);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).ExcludeFromDescription();
app.MapCatalog();
app.MapAuth();
app.MapPasswordReset();
app.MapOrders();
app.MapAdmin();
app.MapAdminProducts();
app.MapReviews();
app.MapNotifications();

app.Run();
