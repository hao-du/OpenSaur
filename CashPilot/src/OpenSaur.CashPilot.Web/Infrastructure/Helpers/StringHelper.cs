using System.Text.Json;

namespace OpenSaur.CashPilot.Web.Infrastructure.Helpers;

public static class StringHelper
{
    public static string[] ParseStringArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        return JsonSerializer.Deserialize<string[]>(json) ?? [];
    }

    public static string NormalizeRoleValue(string value)
    {
        return new string(value
            .Where(char.IsLetterOrDigit)
            .Select(char.ToUpperInvariant)
            .ToArray());
    }
}