namespace OpenSaur.Zentry.Web.Features.OidcClients.CreateOidcClient;

public sealed record CreateOidcClientRequest(
    string ClientId,
    string ClientSecret,
    string DisplayName,
    string[] RedirectUris,
    string[] PostLogoutRedirectUris,
    string Scope);
