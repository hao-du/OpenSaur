namespace OpenSaur.Identity.Web.Features.OidcClients;

public sealed record OidcClientSummaryResponse(
    Guid Id,
    string ClientId,
    string DisplayName,
    string Description,
    string Scope,
    string AppPathBase,
    bool IsActive,
    string[] Origins,
    string[] RedirectUris,
    string[] PostLogoutRedirectUris);
