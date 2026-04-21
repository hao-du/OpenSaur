namespace OpenSaur.Zentry.Web.Features.OidcClients.GetOidcClients;

public sealed record OidcClientSummaryResponse(
    Guid Id,
    string ClientId,
    string DisplayName,
    string ClientType,
    string[] RedirectUris,
    string[] PostLogoutRedirectUris,
    string Scope);

