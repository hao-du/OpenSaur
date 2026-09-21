namespace OpenSaur.Zentry.Web.Infrastructure.Hosting;

public static class FrontendEndpoints
{
    public static IEndpointRouteBuilder MapFrontEndRoutes(this IEndpointRouteBuilder app)
    {
        app.MapFallbackToFile("index.html");

        return app;
    }
}
