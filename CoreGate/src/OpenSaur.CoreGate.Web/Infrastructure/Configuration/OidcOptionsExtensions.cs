namespace OpenSaur.CoreGate.Web.Infrastructure.Configuration;

public static class OidcOptionsExtensions
{
    public static Uri GetIssuerBaseUri(this OidcOptions oidcOptions)
    {
        if (!Uri.TryCreate(oidcOptions.Issuer, UriKind.Absolute, out var issuerUri))
        {
            throw new InvalidOperationException("OIDC issuer configuration is invalid.");
        }

        return issuerUri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal)
            ? issuerUri
            : new Uri($"{issuerUri.AbsoluteUri}/", UriKind.Absolute);
    }
}
