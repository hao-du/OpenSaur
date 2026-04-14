using System.Security.Cryptography.X509Certificates;

namespace OpenSaur.CoreGate.Web.Infrastructure.OpenIddict;

internal static class OpenIddictCertificateLoader
{
    public static X509Certificate2 LoadCertificate(string certificatePath, string? certificatePassword)
    {
        if (!File.Exists(certificatePath))
        {
            throw new InvalidOperationException($"OIDC certificate file '{certificatePath}' was not found.");
        }

        return X509CertificateLoader.LoadPkcs12FromFile(
            certificatePath,
            certificatePassword,
            X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.EphemeralKeySet);
    }
}
