using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace BrikkhoRongon.Api.Services;

/// <summary>Sends an email. Two versions: Resend (real, when Resend:ApiKey is set) and a log-only stand-in for local work.</summary>
public interface IMailer
{
    Task SendAsync(string to, string subject, string html, string text, CancellationToken ct = default);
}

/// <summary>
/// Used when no mail service is configured. On a developer's machine it prints the message (so a reset link can be clicked);
/// anywhere else it prints only a warning, because a link in a log would let anyone with log access take over an account.
/// </summary>
public sealed class LogMailer(ILogger<LogMailer> log, IHostEnvironment env) : IMailer
{
    public Task SendAsync(string to, string subject, string html, string text, CancellationToken ct = default)
    {
        if (env.IsDevelopment()) log.LogInformation("EMAIL (not sent: no mail service configured)\nTo: {To}\nSubject: {Subject}\n\n{Text}", to, subject, text);
        else log.LogWarning("An email was not sent because no mail service is configured. Set Resend__ApiKey.");
        return Task.CompletedTask;
    }
}

/// <summary>Sends through https://resend.com. The key comes from configuration (never the code).</summary>
public sealed class ResendMailer(HttpClient http, IConfiguration config) : IMailer
{
    public async Task SendAsync(string to, string subject, string html, string text, CancellationToken ct = default)
    {
        var from = config["Email:From"] ?? "Brikkhorongon <onboarding@resend.dev>";
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = JsonContent.Create(new { from, to = new[] { to }, subject, html, text }),
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config["Resend:ApiKey"]);
        using var res = await http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
    }
}
