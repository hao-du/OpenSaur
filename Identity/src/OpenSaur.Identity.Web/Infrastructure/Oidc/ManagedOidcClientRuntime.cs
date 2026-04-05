namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed record ManagedOidcClientRuntime(
    Guid Id,
    string ClientId,
    string ClientSecret,
    string DisplayName,
    string Description,
    string Scope,
    string AppPathBase,
    IReadOnlyList<string> Origins,
    IReadOnlyList<string> RedirectUris,
    IReadOnlyList<string> PostLogoutRedirectUris,
    bool IsActive);
