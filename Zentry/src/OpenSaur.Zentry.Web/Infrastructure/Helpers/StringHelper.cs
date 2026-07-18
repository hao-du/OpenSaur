using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;

namespace OpenSaur.Zentry.Web.Infrastructure.Helpers;

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