using System.Text.Json;
using System.Text.Json.Nodes;
using OpenSaur.Zentry.Web.Features.Settings.Dtos;
using OpenSaur.Zentry.Web.Features.Settings.UpdateSettings;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.Settings;

internal static class SettingsJson
{
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

            var locale = JsonHelper.ReadString(document.RootElement, "locale")
                ?? JsonHelper.ReadString(document.RootElement, "language");
            var timeZone = JsonHelper.ReadString(document.RootElement, "timeZone")
                ?? JsonHelper.ReadString(document.RootElement, "timezone");

            return new SettingsResponse(
                IsSupportedLocale(locale) ? locale : null,
                TimeZoneHelper.Contains(timeZone) ? timeZone : null);
        }
        catch (JsonException)
        {
            return new SettingsResponse(null, null);
        }
    }

    public static string Merge(string? userSettings, UpdateSettingsRequest request)
    {
        var rootObject = JsonHelper.ParseObject(userSettings);
        rootObject["locale"] = request.Locale;
        rootObject["timeZone"] = request.TimeZone;

        return rootObject.ToJsonString(new JsonSerializerOptions
        {
            WriteIndented = false
        });
    }

    public static bool IsSupportedLocale(string? locale)
    {
        return string.Equals(locale, "en", StringComparison.Ordinal)
            || string.Equals(locale, "vi", StringComparison.Ordinal);
    }
}
