using Microsoft.AspNetCore.Http;

namespace OpenSaur.Zentry.Web.Infrastructure.Configuration;

public static class ZentryOidcOptionsExtensions
{
    public static Uri GetCurrentAppBaseUri(this ZentryOidcOptions oidcOptions, HttpRequest request)
    {
        if (!string.IsNullOrWhiteSpace(oidcOptions.CurrentAppBaseUri))
        {
            if (!Uri.TryCreate(oidcOptions.CurrentAppBaseUri, UriKind.Absolute, out var currentAppBaseUri))
            {
                throw new InvalidOperationException("Zentry current app base URI configuration is invalid.");
            }

            return EnsureTrailingSlash(currentAppBaseUri);
        }

        return EnsureTrailingSlash(new UriBuilder(
            request.Scheme,
            request.Host.Host,
            request.Host.Port ?? -1)
        {
            Path = NormalizeBasePath(request.PathBase.Value)
        }.Uri);
    }

    private static Uri EnsureTrailingSlash(Uri uri)
    {
        return uri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal)
            ? uri
            : new Uri($"{uri.AbsoluteUri}/", UriKind.Absolute);
    }

    private static string NormalizeBasePath(string? basePath)
    {
        var trimmedBasePath = basePath?.Trim() ?? string.Empty;
        if (trimmedBasePath.Length == 0 || trimmedBasePath == "/")
        {
            return "/";
        }

        return trimmedBasePath.StartsWith("/", StringComparison.Ordinal)
            ? trimmedBasePath.TrimEnd('/')
            : $"/{trimmedBasePath.TrimEnd('/')}";
    }
}
