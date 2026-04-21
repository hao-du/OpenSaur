namespace OpenSaur.Zentry.Web.Features.OidcClients.EditOidcClient;

public sealed record EditOidcClientRequest(
    Guid Id,
    string ClientId,
    string ClientType,
    string ClientSecret,
    string DisplayName,
    string[] RedirectUris,
    string[] PostLogoutRedirectUris,
    string Scope);
