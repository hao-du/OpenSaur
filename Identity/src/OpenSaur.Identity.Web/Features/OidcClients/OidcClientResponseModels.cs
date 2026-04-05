namespace OpenSaur.Identity.Web.Features.OidcClients;

public sealed record OidcClientSummaryResponse(
    Guid Id,
    string AppPathBase,
    string CallbackPath,
    string ClientId,
    string Description,
    string DisplayName,
    bool IsActive,
    string[] Origins,
    string PostLogoutPath,
    string[] RedirectUris,
    string[] PostLogoutRedirectUris,
    string Scope);
