using Microsoft.AspNetCore.Mvc;
using OpenSaur.Zentry.Web.Features.Frontend.Handlers;

namespace OpenSaur.Zentry.Web.Infrastructure.Hosting;

public static class FrontendEndpoints
{
    public static IEndpointRouteBuilder MapFrontEndRoutes(this IEndpointRouteBuilder app)
    {
        app.MapGet("/app-config.js", async Task<IResult> ([FromServices] CreateAppConfigJsHandler createAppConfigJsHandler) =>
        {
            return await createAppConfigJsHandler.HandleAppConfigJs();
        }).AllowAnonymous();

        app.MapFallbackToFile("index.html");

        return app;
    }
}
