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
        "/change-password"
    ];

    public static bool IsShellRoute(PathString path)
    {
        return ShellRoutes.Contains(path.Value, StringComparer.OrdinalIgnoreCase);
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
        IFileInfo indexFile = environment.WebRootFileProvider.GetFileInfo("index.html");
        if (!indexFile.Exists || string.IsNullOrWhiteSpace(indexFile.PhysicalPath))
        {
            return Task.FromResult<IResult>(TypedResults.NotFound());
        }

        return Task.FromResult<IResult>(TypedResults.PhysicalFile(indexFile.PhysicalPath, "text/html; charset=utf-8"));
    }
}
