namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public string Issuer { get; set; } = string.Empty;

    public FirstPartyWebOidcOptions FirstPartyWeb { get; set; } = new();

    public string? SigningCertificatePath { get; set; }

    public string? SigningCertificatePassword { get; set; }

    public string? EncryptionCertificatePath { get; set; }

    public string? EncryptionCertificatePassword { get; set; }
}

public sealed class FirstPartyWebOidcOptions
{
    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string RedirectUri { get; set; } = string.Empty;
}
