namespace OpenSaur.Identity.Web.Features.OidcClients.CreateOidcClient;

public sealed record CreateOidcClientRequest(
    string AppPathBase,
    string CallbackPath,
    string ClientId,
    string ClientSecret,
    string Description,
    string DisplayName,
    string[] Origins,
    string PostLogoutPath,
    string Scope);
