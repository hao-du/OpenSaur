namespace OpenSaur.CoreGate.Web.Infrastructure.Configuration;

public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public string Issuer { get; set; } = string.Empty;

    public string? SigningCertificatePath { get; set; }

    public string? SigningCertificatePassword { get; set; }

    public string? EncryptionCertificatePath { get; set; }

    public string? EncryptionCertificatePassword { get; set; }
}
