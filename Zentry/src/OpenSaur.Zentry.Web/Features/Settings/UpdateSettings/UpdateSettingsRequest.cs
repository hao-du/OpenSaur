namespace OpenSaur.Zentry.Web.Features.Settings.UpdateSettings;

public sealed record UpdateSettingsRequest(
    string Locale,
    string TimeZone);
