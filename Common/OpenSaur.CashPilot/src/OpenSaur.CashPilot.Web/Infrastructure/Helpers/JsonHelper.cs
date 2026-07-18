using System.Text.Json;
using System.Text.Json.Nodes;


namespace OpenSaur.CashPilot.Web.Infrastructure.Helpers;

internal static class JsonHelper
{
    public static string? ReadString(JsonElement rootElement, string propertyName)
    {
        return rootElement.TryGetProperty(propertyName, out var value)
            && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    public static JsonObject ParseObject(string? userSettings)
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
