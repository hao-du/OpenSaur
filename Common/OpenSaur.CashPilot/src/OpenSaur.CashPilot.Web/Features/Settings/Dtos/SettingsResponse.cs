namespace OpenSaur.CashPilot.Web.Features.Settings.Dtos;

public sealed record SettingsResponse(
    string? Locale,
    string? TimeZone);
