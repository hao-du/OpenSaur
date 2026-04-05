using Microsoft.AspNetCore.Http;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public static class OidcOptionsExtensions
{
    public static string[] GetFirstPartyScopes(this OidcOptions oidcOptions)
    {
        return oidcOptions.GetFirstPartyClient().Scope
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    public static string BuildFirstPartyRedirectUri(this HttpContext httpContext)
    {
        var redirectPath = httpContext.Request.PathBase.Add("/auth/callback");

        return new UriBuilder(
            httpContext.Request.Scheme,
            httpContext.Request.Host.Host,
            httpContext.Request.Host.Port ?? -1)
        {
            Path = redirectPath.Value
        }.Uri.AbsoluteUri;
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

    public static bool IsIssuerHostedRequest(this OidcOptions oidcOptions, HttpRequest request)
    {
        var issuerUri = oidcOptions.GetIssuerBaseUri();
        var requestPort = request.Host.Port ?? GetDefaultPort(request.Scheme);
        var issuerPort = issuerUri.IsDefaultPort
            ? GetDefaultPort(issuerUri.Scheme)
            : issuerUri.Port;

        return string.Equals(request.Scheme, issuerUri.Scheme, StringComparison.OrdinalIgnoreCase)
               && string.Equals(request.Host.Host, issuerUri.Host, StringComparison.OrdinalIgnoreCase)
               && requestPort == issuerPort
               && string.Equals(
                   NormalizeBasePath(request.PathBase.Value),
                   NormalizeBasePath(issuerUri.AbsolutePath),
                   StringComparison.OrdinalIgnoreCase);
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
