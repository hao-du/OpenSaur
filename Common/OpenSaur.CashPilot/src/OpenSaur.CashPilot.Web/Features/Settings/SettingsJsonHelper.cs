using System.Text.Json;
using OpenSaur.CashPilot.Web.Features.Settings.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;

namespace OpenSaur.CashPilot.Web.Features.Settings;

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

    public static bool IsSupportedLocale(string? locale)
    {
        return string.Equals(locale, "en", StringComparison.Ordinal)
            || string.Equals(locale, "vi", StringComparison.Ordinal);
    }
}
