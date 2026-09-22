namespace OpenSaur.CashPilot.Web.Features.Frontend;

public static class FrontendEndpoints
{
    public static IEndpointRouteBuilder MapFrontEndRoutes(this IEndpointRouteBuilder app)
    {
        app.MapFallbackToFile("index.html");

        return app;
    }
}
