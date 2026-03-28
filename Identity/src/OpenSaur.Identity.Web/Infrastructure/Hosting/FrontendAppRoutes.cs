using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;

namespace OpenSaur.Identity.Web.Infrastructure.Hosting;

public static class FrontendAppRoutes
{
    private static readonly string[] ShellRoutes =
    [
        "/",
        "/login",
        "/auth/callback",
        "/change-password",
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

    public static IEndpointRouteBuilder MapShellRoutes(this IEndpointRouteBuilder app)
    {
        foreach (var route in ShellRoutes)
        {
            app.MapGet(route, ServeShellAsync)
                .AllowAnonymous();
        }

        return app;
    }

    private static Task<IResult> ServeShellAsync(IWebHostEnvironment environment)
    {
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
}
