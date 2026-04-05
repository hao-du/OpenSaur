using Microsoft.AspNetCore.Http;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public static class OidcOptionsExtensions
{
    public static string[] GetFirstPartyScopes(this OidcOptions oidcOptions)
    {
        return oidcOptions.GetFirstPartyClient().Scope
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    public static string BuildFirstPartyRedirectUri(this HttpContext httpContext, OidcOptions oidcOptions)
    {
        return new Uri(oidcOptions.GetCurrentAppBaseUri(httpContext.Request), "auth/callback").AbsoluteUri;
    }

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

        return BuildRequestBaseUri(request);
    }

    public static bool IsIssuerHostedRequest(this OidcOptions oidcOptions, HttpRequest request)
    {
        var currentAppBaseUri = oidcOptions.GetCurrentAppBaseUri(request);
        var issuerUri = oidcOptions.GetIssuerBaseUri();
        var currentAppPort = currentAppBaseUri.IsDefaultPort
            ? GetDefaultPort(currentAppBaseUri.Scheme)
            : currentAppBaseUri.Port;
        var issuerPort = issuerUri.IsDefaultPort
            ? GetDefaultPort(issuerUri.Scheme)
            : issuerUri.Port;

        return string.Equals(currentAppBaseUri.Scheme, issuerUri.Scheme, StringComparison.OrdinalIgnoreCase)
               && string.Equals(currentAppBaseUri.Host, issuerUri.Host, StringComparison.OrdinalIgnoreCase)
               && currentAppPort == issuerPort
               && string.Equals(
                   NormalizeBasePath(currentAppBaseUri.AbsolutePath),
                   NormalizeBasePath(issuerUri.AbsolutePath),
                   StringComparison.OrdinalIgnoreCase);
    }

    private static Uri BuildRequestBaseUri(HttpRequest request)
    {
        var normalizedPathBase = NormalizeBasePath(request.PathBase.Value);

        return new UriBuilder(
            request.Scheme,
            request.Host.Host,
            request.Host.Port ?? -1)
        {
            Path = normalizedPathBase
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

    private static int GetDefaultPort(string scheme)
    {
        return string.Equals(scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
            ? 443
            : 80;
    }
}
