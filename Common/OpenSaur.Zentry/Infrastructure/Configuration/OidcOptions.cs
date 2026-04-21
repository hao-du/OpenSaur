namespace OpenSaur.Zentry.Web.Infrastructure.Configuration;

public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public string AppName { get; set; } = "OpenSaur Zentry";

    public string Authority { get; set; } = string.Empty;

    public string ClientId { get; set; } = string.Empty;

    public string Scope { get; set; } = "openid profile email roles offline_access";

    public string RedirectPath { get; set; } = "/auth/callback";

    public string PostLogoutRedirectPath { get; set; } = "/";

    public string? CurrentAppBaseUri { get; set; }
}
