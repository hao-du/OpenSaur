using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenSaur.Identity.Web.Infrastructure.Http.Configuration;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Hosting;

public static class FrontendAppRoutes
{
    private static readonly JsonSerializerOptions RuntimeConfigSerializerOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] ShellRoutes =
    [
        "/",
        "/auth-required",
        "/change-password",
        "/profile",
        "/settings",
        "/users",
        "/workspaces",
        "/roles",
        "/role-assignments"
    ];

    public static bool IsShellRoute(PathString path)
    {
        return ShellRoutes.Contains(path.Value, StringComparer.OrdinalIgnoreCase);
    }

    public static bool ShouldServeBuiltShell(IWebHostEnvironment environment)
    {
        return !environment.IsDevelopment() || HasBuiltShell(environment);
    }

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

    private static async Task<IResult> ServeRuntimeConfigAsync(
        HttpContext httpContext,
        IOptions<OidcOptions> oidcOptionsAccessor,
        IOptions<GoogleRecaptchaOptions> googleRecaptchaOptionsAccessor,
        CancellationToken cancellationToken)
    {
        var oidcOptions = oidcOptionsAccessor.Value;
        var googleRecaptchaOptions = googleRecaptchaOptionsAccessor.Value;
        var currentAppBaseUri = oidcOptions.GetCurrentAppBaseUri(httpContext.Request);
        await Task.CompletedTask;
        ApplyNoStoreHeaders(httpContext.Response);
        var runtimeConfig = new FrontendRuntimeConfig(
            AppName: "OpenSaur Identity",
            BasePath: NormalizeBasePath(currentAppBaseUri.AbsolutePath),
            FirstPartyAuth: new FrontendRuntimeFirstPartyAuth(
                oidcOptions.Issuer,
                oidcOptions.BootstrapClient.ClientId,
                new Uri(currentAppBaseUri, oidcOptions.BootstrapClient.CallbackPath.TrimStart('/')).AbsoluteUri,
                oidcOptions.BootstrapClient.Scope,
                true),
            GoogleRecaptchaV3: new FrontendRuntimeGoogleRecaptchaV3(
                googleRecaptchaOptions.IsConfigured,
                googleRecaptchaOptions.IsConfigured ? googleRecaptchaOptions.SiteKey : string.Empty,
                googleRecaptchaOptions.LoginAction));

        return TypedResults.Text(
            $"window.__OPENSAUR_IDENTITY_CONFIG__ = Object.freeze({JsonSerializer.Serialize(runtimeConfig, RuntimeConfigSerializerOptions)});",
            "application/javascript; charset=utf-8");
    }

    private static Task<IResult> ServeShellAsync(HttpContext httpContext, IWebHostEnvironment environment)
    {
        ApplyNoStoreHeaders(httpContext.Response);
        IFileInfo indexFile = GetShellIndexFile(environment);
        if (!indexFile.Exists || string.IsNullOrWhiteSpace(indexFile.PhysicalPath))
        {
            return Task.FromResult<IResult>(TypedResults.NotFound());
        }

        return Task.FromResult<IResult>(TypedResults.PhysicalFile(indexFile.PhysicalPath, "text/html; charset=utf-8"));
    }

    private static bool HasBuiltShell(IWebHostEnvironment environment)
    {
        return GetShellIndexFile(environment).Exists;
    }

    private static IFileInfo GetShellIndexFile(IWebHostEnvironment environment)
    {
        return environment.WebRootFileProvider.GetFileInfo("index.html");
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
        FrontendRuntimeFirstPartyAuth FirstPartyAuth,
        FrontendRuntimeGoogleRecaptchaV3 GoogleRecaptchaV3);

    private sealed record FrontendRuntimeFirstPartyAuth(
        string Issuer,
        string ClientId,
        string RedirectUri,
        string Scope,
        bool IsIssuerHostedApp);

    private sealed record FrontendRuntimeGoogleRecaptchaV3(
        bool Enabled,
        string SiteKey,
        string LoginAction);
}
