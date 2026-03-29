using System.Text.Json;
using System.Text.Json.Nodes;
using OpenSaur.Identity.Web.Infrastructure.Time;

namespace OpenSaur.Identity.Web.Features.Auth.Settings;

internal static class CurrentUserSettingsJson
{
    public static AuthSettingsResponse Read(string? userSettings)
    {
        if (string.IsNullOrWhiteSpace(userSettings))
        {
            return new AuthSettingsResponse(null, null);
        }

        try
        {
            using var document = JsonDocument.Parse(userSettings);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new AuthSettingsResponse(null, null);
            }

            var locale = ReadString(document.RootElement, "locale")
                         ?? ReadString(document.RootElement, "language");
            var timeZone = ReadString(document.RootElement, "timeZone")
                           ?? ReadString(document.RootElement, "timezone");

            return new AuthSettingsResponse(
                IsSupportedLocale(locale) ? locale : null,
                IsSupportedTimeZone(timeZone) ? timeZone : null);
        }
        catch (JsonException)
        {
            return new AuthSettingsResponse(null, null);
        }
    }

    public static string Merge(string? userSettings, UpdateCurrentUserSettingsRequest request)
    {
        var rootObject = ParseObject(userSettings);
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

    public static bool IsSupportedTimeZone(string? timeZone)
    {
        return !string.IsNullOrWhiteSpace(timeZone)
               && IanaTimeZoneCatalog.Contains(timeZone);
    }

    private static string? ReadString(JsonElement rootElement, string propertyName)
    {
        return rootElement.TryGetProperty(propertyName, out var value)
               && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static JsonObject ParseObject(string? userSettings)
    {
        if (string.IsNullOrWhiteSpace(userSettings))
        {
            return [];
        }

        try
        {
            var parsedNode = JsonNode.Parse(userSettings);
            return parsedNode as JsonObject ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
