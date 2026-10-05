using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace OpenSaur.Brainbubby.Web.Features.Frontend;

public static class FrontendEndpoints
{
    public static IEndpointRouteBuilder MapFrontEndRoutes(this IEndpointRouteBuilder app)
    {
        app.MapFallback(async (context) =>
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html");
            if (File.Exists(filePath))
            {
                context.Response.ContentType = "text/html";
                await context.Response.SendFileAsync(filePath);
            }
            else
            {
                context.Response.StatusCode = 404;
            }
        }).AllowAnonymous();

        return app;
    }
}