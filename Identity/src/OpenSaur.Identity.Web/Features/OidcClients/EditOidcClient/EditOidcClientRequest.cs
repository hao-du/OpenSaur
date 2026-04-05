namespace OpenSaur.Identity.Web.Features.OidcClients.EditOidcClient;

public sealed record EditOidcClientRequest(
    Guid Id,
    string ClientId,
    string ClientSecret,
    string DisplayName,
    string Description,
    string Scope,
    string AppPathBase,
    bool IsActive,
    string[] Origins);
