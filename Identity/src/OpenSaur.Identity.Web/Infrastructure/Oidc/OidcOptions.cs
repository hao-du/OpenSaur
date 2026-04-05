namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public BootstrapFirstPartyClientOidcOptions BootstrapClient { get; set; } = new();

    public CurrentManagedClientOidcOptions CurrentClient { get; set; } = new();

    public string Issuer { get; set; } = string.Empty;

    public string? CurrentAppBaseUri { get; set; }

    public string? SigningCertificatePath { get; set; }

    public string? SigningCertificatePassword { get; set; }

    public string? EncryptionCertificatePath { get; set; }

    public string? EncryptionCertificatePassword { get; set; }

    public bool AllowEphemeralKeysInProduction { get; set; }
}

public sealed class BootstrapFirstPartyClientOidcOptions
{
    public string AppPathBase { get; set; } = "/identity";

    public string CallbackPath { get; set; } = "/auth/callback";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string Scope { get; set; } = "openid profile email roles offline_access api";

    public string PostLogoutPath { get; set; } = "/login";

    public string DisplayName { get; set; } = string.Empty;

    public List<string> Origins { get; set; } = [];
}

public sealed class CurrentManagedClientOidcOptions
{
    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;
}
