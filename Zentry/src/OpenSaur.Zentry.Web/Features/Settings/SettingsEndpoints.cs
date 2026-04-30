using FluentValidation;
using OpenSaur.Zentry.Web.Features.Settings.GetSettings;
using OpenSaur.Zentry.Web.Features.Settings.UpdateSettings;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Features.Settings;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/api/settings")
            .RequireAuthorization();

        settings.MapGet("", GetSettingsHandler.HandleAsync);
        settings.MapPut("", (UpdateSettingsRequest request, IValidator<UpdateSettingsRequest> validator, ClaimsPrincipal user, ApplicationDbContext dbContext, CancellationToken cancellationToken) =>
            UpdateSettingsHandler.HandleAsync(request, validator, user, dbContext, cancellationToken));

        return app;
    }
}
