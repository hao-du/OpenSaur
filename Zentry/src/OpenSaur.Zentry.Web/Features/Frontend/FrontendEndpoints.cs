using Microsoft.AspNetCore.Components.Routing;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Features.Frontend.Handlers;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Infrastructure.Hosting;

public static class FrontendEndpoints
{
    private static readonly string[] Routes =
    [
        "/",
        "/auth/callback",
        "/dashboard"
    ];

    public static IEndpointRouteBuilder MapFrontEndRoutes(this IEndpointRouteBuilder app)
    {
        app.MapGet("/app-config.js", async Task<IResult> (CreateAppConfigJsHandler createAppConfigJsHandler) =>
        {
            return await createAppConfigJsHandler.HandleAppConfigJs();
        }).AllowAnonymous();

        foreach (var route in Routes)
        {
            app.MapGet(route, async Task<IResult> (CreateFrontendRouteHandler createFrontendRouteHandler) =>
            {
                return await createFrontendRouteHandler.HandleFrontendRoute();
            }).AllowAnonymous();
        }

        return app;
    }
}

