using OpenSaur.CashPilot.Web.Features.Profile.Profile.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Profile;

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var profile = app.MapGroup("/api/profile")
            .RequireAuthorization(AppAuthorization.CashPilotCanManagePolicyName);

        profile.MapGet("/current", CurrentProfileHandler.HandleAsync);

        return app;
    }
}
