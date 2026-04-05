namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public string Issuer { get; set; } = string.Empty;

    public FirstPartyClientOidcOptions FirstPartyClient { get; set; } = new();

    public string? SigningCertificatePath { get; set; }

    public string? SigningCertificatePassword { get; set; }

    public string? EncryptionCertificatePath { get; set; }

    public string? EncryptionCertificatePassword { get; set; }

    public bool AllowEphemeralKeysInProduction { get; set; }

    public FirstPartyClientOidcOptions GetFirstPartyClient(string? redirectUri = null)
    {
        if (string.IsNullOrWhiteSpace(FirstPartyClient.ClientId))
        {
            throw new InvalidOperationException("OIDC first-party client configuration is required.");
        }

        if (string.IsNullOrWhiteSpace(redirectUri))
        {
            return FirstPartyClient;
        }

        if (!FirstPartyClient.RedirectUris.Any(configuredRedirectUri =>
                string.Equals(configuredRedirectUri, redirectUri, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException(
                $"OIDC first-party client does not allow redirect URI '{redirectUri}'.");
        }

        return FirstPartyClient;
    }
}

public sealed class FirstPartyClientOidcOptions
{
    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public List<string> RedirectUris { get; set; } = [];

    public List<string> PostLogoutRedirectUris { get; set; } = [];

    public string Scope { get; set; } = "openid profile email roles offline_access api";

    public string DisplayName { get; set; } = string.Empty;
}
