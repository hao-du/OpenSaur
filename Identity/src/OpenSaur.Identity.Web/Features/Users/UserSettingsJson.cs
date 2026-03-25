using System.Text.Json;

namespace OpenSaur.Identity.Web.Features.Users;

internal static class UserSettingsJson
{
    public static bool IsValid(string? userSettings)
    {
        if (string.IsNullOrWhiteSpace(userSettings))
        {
            return true;
        }

        try
        {
            using var _ = JsonDocument.Parse(userSettings);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
