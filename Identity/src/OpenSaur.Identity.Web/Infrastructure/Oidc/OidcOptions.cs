namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public string Issuer { get; set; } = string.Empty;

    public string HostedIdentityClient { get; set; } = "hosted-identity";

    public Dictionary<string, BrowserClientOidcOptions> BrowserClients { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public string? SigningCertificatePath { get; set; }

    public string? SigningCertificatePassword { get; set; }

    public string? EncryptionCertificatePath { get; set; }

    public string? EncryptionCertificatePassword { get; set; }

    public bool AllowEphemeralKeysInProduction { get; set; }

    public BrowserClientOidcOptions GetHostedIdentityClient()
    {
        if (string.IsNullOrWhiteSpace(HostedIdentityClient))
        {
            throw new InvalidOperationException("OIDC hosted identity client configuration is required.");
        }

        if (!BrowserClients.TryGetValue(HostedIdentityClient, out var browserClient))
        {
            throw new InvalidOperationException(
                $"OIDC hosted identity client '{HostedIdentityClient}' is not configured.");
        }

        return browserClient;
    }
}

public sealed class BrowserClientOidcOptions
{
    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public List<string> RedirectUris { get; set; } = [];

    public List<string> PostLogoutRedirectUris { get; set; } = [];

    public string Scope { get; set; } = "openid profile email roles offline_access api";

    public string DisplayName { get; set; } = string.Empty;
}
