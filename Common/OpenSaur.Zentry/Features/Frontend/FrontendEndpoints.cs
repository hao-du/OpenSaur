using Microsoft.AspNetCore.Mvc;
using OpenSaur.Zentry.Web.Features.Frontend.Handlers;

namespace OpenSaur.Zentry.Web.Infrastructure.Hosting;

public static class FrontendEndpoints
{
    private static readonly string[] Routes =
    [
        "/",
        "/auth/callback",
        "/dashboard",
        "/prepare-session"
    ];

    public static IEndpointRouteBuilder MapFrontEndRoutes(this IEndpointRouteBuilder app)
    {
        app.MapGet("/app-config.js", async Task<IResult> ([FromServices] CreateAppConfigJsHandler createAppConfigJsHandler) =>
        {
            return await createAppConfigJsHandler.HandleAppConfigJs();
        }).AllowAnonymous();

        foreach (var route in Routes)
        {
            app.MapGet(route, async Task<IResult> ([FromServices] CreateFrontendRouteHandler createFrontendRouteHandler) =>
            {
                return await createFrontendRouteHandler.HandleFrontendRoute();
            }).AllowAnonymous();
        }

        return app;
    }
}

