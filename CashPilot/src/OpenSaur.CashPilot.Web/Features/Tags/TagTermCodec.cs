using System.Text.Json;

namespace OpenSaur.CashPilot.Web.Features.Tags;

public static class TagTermCodec
{
    public static string Encode(IEnumerable<string> terms)
    {
        var normalized = NormalizeTerms(terms);
        return JsonSerializer.Serialize(normalized);
    }

    public static string[] Decode(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded))
        {
            return [];
        }

        try
        {
            return NormalizeTerms(JsonSerializer.Deserialize<string[]>(encoded) ?? []);
        }
        catch
        {
            return [];
        }
    }

    public static string[] NormalizeTerms(IEnumerable<string> terms)
    {
        return terms
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}
