namespace OpenSaur.Identity.Web.Features.OidcClients.CreateOidcClient;

public sealed record CreateOidcClientRequest(
    string ClientId,
    string ClientSecret,
    string DisplayName,
    string Description,
    string Scope,
    string AppPathBase,
    string[] Origins);
