namespace OpenSaur.CashPilot.Web.Features.Frontend.Dtos;

internal sealed record FrontentAppConfigJsDto(
    string AppName,
    string BasePath,
    string Authority,
    string ClientId,
    string RedirectUri,
    string PostLogoutRedirectUri,
    string Scope);
