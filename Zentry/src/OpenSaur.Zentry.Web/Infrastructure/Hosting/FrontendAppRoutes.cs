using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;

namespace OpenSaur.Zentry.Web.Infrastructure.Hosting;

public static class FrontendAppRoutes
{
    private static readonly JsonSerializerOptions RuntimeConfigSerializerOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] ShellRoutes =
    [
        "/",
        "/auth/callback",
        "/dashboard"
    ];

    public static IEndpointRouteBuilder MapShellRuntimeConfig(this IEndpointRouteBuilder app)
    {
        app.MapGet("/app-config.js", ServeRuntimeConfigAsync)
            .AllowAnonymous();

        return app;
    }

    public static IEndpointRouteBuilder MapShellRoutes(this IEndpointRouteBuilder app)
    {
        foreach (var route in ShellRoutes)
        {
            app.MapGet(route, ServeShellAsync)
                .AllowAnonymous();
        }

        return app;
    }

    private static Task<IResult> ServeShellAsync(HttpContext httpContext, IWebHostEnvironment environment)
    {
        ApplyNoStoreHeaders(httpContext.Response);
        IFileInfo indexFile = environment.WebRootFileProvider.GetFileInfo("index.html");
        if (!indexFile.Exists || string.IsNullOrWhiteSpace(indexFile.PhysicalPath))
        {
            return Task.FromResult<IResult>(TypedResults.NotFound());
        }

        return Task.FromResult<IResult>(TypedResults.PhysicalFile(indexFile.PhysicalPath, "text/html; charset=utf-8"));
    }

    private static Task<IResult> ServeRuntimeConfigAsync(
        HttpContext httpContext,
        IOptions<ZentryOidcOptions> oidcOptionsAccessor)
    {
        var oidcOptions = oidcOptionsAccessor.Value;
        var currentAppBaseUri = oidcOptions.GetCurrentAppBaseUri(httpContext.Request);

        ApplyNoStoreHeaders(httpContext.Response);
        var runtimeConfig = new FrontendRuntimeConfig(
            oidcOptions.AppName,
            NormalizeBasePath(currentAppBaseUri.AbsolutePath),
            oidcOptions.Authority,
            oidcOptions.ClientId,
            new Uri(currentAppBaseUri, oidcOptions.RedirectPath.TrimStart('/')).AbsoluteUri,
            new Uri(currentAppBaseUri, oidcOptions.PostLogoutRedirectPath.TrimStart('/')).AbsoluteUri,
            oidcOptions.Scope);

        return Task.FromResult<IResult>(TypedResults.Text(
            $"window.__OPENSAUR_ZENTRY_CONFIG__ = Object.freeze({JsonSerializer.Serialize(runtimeConfig, RuntimeConfigSerializerOptions)});",
            "application/javascript; charset=utf-8"));
    }

    private static void ApplyNoStoreHeaders(HttpResponse response)
    {
        response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        response.Headers.Pragma = "no-cache";
        response.Headers.Expires = "0";
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

    private sealed record FrontendRuntimeConfig(
        string AppName,
        string BasePath,
        string Authority,
        string ClientId,
        string RedirectUri,
        string PostLogoutRedirectUri,
        string Scope);
}
