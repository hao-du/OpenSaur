using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace OpenSaur.RuleAgent.Web.Features.Frontend;

public static class FrontendEndpoints
{
    public static IEndpointRouteBuilder MapFrontEndRoutes(this IEndpointRouteBuilder app)
    {
        app.MapFallbackToFile("index.html");

        return app;
    }
}