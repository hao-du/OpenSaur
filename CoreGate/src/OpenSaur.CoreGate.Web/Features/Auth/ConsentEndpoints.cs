using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;
using System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class ConsentEndpoints
{
    public static IEndpointRouteBuilder MapConsentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/consent");

        group.MapGet("/", async (
            GetConsentDetailsHandler handler,
            ClaimsPrincipal user,
            string? returnUrl,
            CancellationToken cancellationToken) =>
        {
            var request = new GetConsentDetailsRequest(returnUrl ?? string.Empty);
            return await handler.HandleAsync(request, user, cancellationToken);
        });

        group.MapPost("/", async (
            ConsentDecisionHandler handler,
            ClaimsPrincipal user,
            ConsentDecisionRequest request,
            CancellationToken cancellationToken) =>
        {
            return await handler.HandleAsync(request, user, cancellationToken);
        });

        return app;
    }
}
