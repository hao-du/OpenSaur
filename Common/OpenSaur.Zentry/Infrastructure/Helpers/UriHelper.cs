using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;

namespace OpenSaur.Zentry.Web.Infrastructure.Helpers;

public static class UriHelper
{
    public static void ApplyNoStoreHeaders(HttpResponse response)
    {
        response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        response.Headers.Pragma = "no-cache";
        response.Headers.Expires = "0";
    }

    public static Uri GetCurrentAppBaseUri(string? baseUri)
    {
        if (!Uri.TryCreate(baseUri, UriKind.Absolute, out var currentAppBaseUri))
        {
            throw new InvalidOperationException("Base URI configuration is invalid.");
        }

        return EnsureTrailingSlash(currentAppBaseUri);
    }

    public static Uri EnsureTrailingSlash(Uri uri)
    {
        return uri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal)
            ? uri
            : new Uri($"{uri.AbsoluteUri}/", UriKind.Absolute);
    }

    public static string NormalizeBasePath(string? basePath)
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