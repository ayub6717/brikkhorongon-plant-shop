using System.Security.Cryptography;

namespace BrikkhoRongon.Api.Services;

public static class OrderIds
{
    // No 0/O/1/I/L so the number is easy to read out over the phone.
    private const string Alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

    /// <summary>A prefix plus random characters. Orders use BRK- + 8 (about 40 bits): practically impossible to guess.</summary>
    public static string New(string prefix = "BRK-", int length = 8) => prefix + string.Create(length, 0, (span, _) =>
    {
        Span<byte> bytes = stackalloc byte[span.Length];
        RandomNumberGenerator.Fill(bytes);
        for (var i = 0; i < span.Length; i++) span[i] = Alphabet[bytes[i] % Alphabet.Length];
    });
}
