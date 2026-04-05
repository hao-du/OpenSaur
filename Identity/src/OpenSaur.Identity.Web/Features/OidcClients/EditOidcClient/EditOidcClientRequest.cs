namespace OpenSaur.Identity.Web.Features.OidcClients.EditOidcClient;

public sealed record EditOidcClientRequest(
    Guid Id,
    string AppPathBase,
    string CallbackPath,
    string ClientId,
    string ClientSecret,
    string Description,
    string DisplayName,
    bool IsActive,
    string[] Origins,
    string PostLogoutPath,
    string Scope);
