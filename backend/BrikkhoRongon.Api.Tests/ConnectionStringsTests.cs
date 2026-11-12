using BrikkhoRongon.Api.Data;
using Npgsql;

namespace BrikkhoRongon.Api.Tests;

public class ConnectionStringsTests
{
    [Fact]
    public void Converts_a_hosted_url_into_npgsql_settings()
    {
        var b = new NpgsqlConnectionStringBuilder(
            ConnectionStrings.Normalize("postgresql://app_user:p%40ss@db.example.com/shop?sslmode=require"));
        Assert.Equal("db.example.com", b.Host);
        Assert.Equal(5432, b.Port);
        Assert.Equal("shop", b.Database);
        Assert.Equal("app_user", b.Username);
        Assert.Equal("p@ss", b.Password);      // %40 decodes to @
        Assert.Equal(SslMode.Require, b.SslMode);
    }

    [Fact]
    public void Leaves_a_normal_connection_string_alone()
    {
        const string local = "Host=localhost;Port=5432;Database=brikkhorongon;Username=postgres;Password=x";
        Assert.Equal(local, ConnectionStrings.Normalize(local));
    }
}
