using Microsoft.AspNetCore.Http;

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

    public static Uri GetCurrentAppBaseUri(this OidcOptions oidcOptions, HttpRequest request)
    {
        if (!string.IsNullOrWhiteSpace(oidcOptions.CurrentAppBaseUri))
        {
            if (!Uri.TryCreate(oidcOptions.CurrentAppBaseUri, UriKind.Absolute, out var currentAppBaseUri))
            {
                throw new InvalidOperationException("OIDC current app base URI configuration is invalid.");
            }

            return currentAppBaseUri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal)
                ? currentAppBaseUri
                : new Uri($"{currentAppBaseUri.AbsoluteUri}/", UriKind.Absolute);
        }

        return new UriBuilder(request.Scheme, request.Host.Host, request.Host.Port ?? -1)
        {
            Path = NormalizeBasePath(request.PathBase.Value)
        }.Uri;
    }

    private static string NormalizeBasePath(string? path)
    {
        var trimmedPath = path?.Trim() ?? string.Empty;
        if (trimmedPath.Length == 0 || trimmedPath == "/")
        {
            return "/";
        }

        return trimmedPath.TrimEnd('/');
    }
}
