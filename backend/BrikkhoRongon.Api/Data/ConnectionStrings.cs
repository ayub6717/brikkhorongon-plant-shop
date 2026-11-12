using Npgsql;

namespace BrikkhoRongon.Api.Data;

public static class ConnectionStrings
{
    /// <summary>
    /// Hosting sites (Neon, Render, Railway) hand out a URL like <c>postgresql://user:pass@host/db?sslmode=require</c>,
    /// but Npgsql wants <c>Host=...;Username=...</c>. This accepts both forms.
    /// </summary>
    public static string Normalize(string raw)
    {
        raw = raw.Trim();
        if (!raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)) return raw;

        var uri = new Uri(raw);
        var user = uri.UserInfo.Split(':', 2);
        return new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(user[0]),
            Password = user.Length > 1 ? Uri.UnescapeDataString(user[1]) : null,
            SslMode = SslMode.Require, // hosted databases only accept encrypted connections
        }.ConnectionString;
    }
}
