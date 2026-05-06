using FluentValidation;
using OpenSaur.CashPilot.Web.Features.Settings.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Settings;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/api/settings")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        settings.MapGet("", GetSettingsHandler.HandleAsync);

        return app;
    }
}
