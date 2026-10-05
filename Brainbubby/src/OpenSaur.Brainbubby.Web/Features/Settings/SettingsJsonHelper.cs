using System.Text.Json;
using OpenSaur.Brainbubby.Web.Features.Settings.Dtos;

namespace OpenSaur.Brainbubby.Web.Features.Settings;

internal static class SettingsJsonHelper
{
    private static readonly HashSet<string> SupportedLocales = new(StringComparer.OrdinalIgnoreCase) { "en", "vi" };

    public static SettingsResponse Read(string? userSettings)
    {
        if (string.IsNullOrWhiteSpace(userSettings))
        {
            return new SettingsResponse(null, null);
        }

        try
        {
            using var document = JsonDocument.Parse(userSettings);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new SettingsResponse(null, null);
            }

            var locale = ReadString(document.RootElement, "locale")
                ?? ReadString(document.RootElement, "language");

            var timeZone = ReadString(document.RootElement, "timeZone")
                ?? ReadString(document.RootElement, "timezone");

            return new SettingsResponse(
                IsSupportedLocale(locale) ? locale : null,
                timeZone);
        }
        catch (JsonException)
        {
            return new SettingsResponse(null, null);
        }
    }

    private static bool IsSupportedLocale(string? locale)
    {
        return !string.IsNullOrWhiteSpace(locale) && SupportedLocales.Contains(locale);
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            return prop.GetString();
        }

        return null;
    }
}
