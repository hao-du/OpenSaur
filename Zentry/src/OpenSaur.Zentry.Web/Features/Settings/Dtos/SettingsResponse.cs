namespace OpenSaur.Zentry.Web.Features.Settings.Dtos;

public sealed record SettingsResponse(
    string? Locale,
    string? TimeZone);
