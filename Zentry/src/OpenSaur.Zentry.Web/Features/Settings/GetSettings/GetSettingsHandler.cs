using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Features.Settings.Dtos;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Settings.GetSettings;

public static class GetSettingsHandler
{
    public static async Task<Results<Ok<SettingsResponse>, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest("User is required.", "Settings require an authenticated user identifier.");
        }

        var userSettings = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == currentUserId)
            .Select(candidate => candidate.UserSettings)
            .SingleOrDefaultAsync(cancellationToken);
        if (userSettings is null)
        {
            return AppHttpResults.NotFound("User not found.", "No user matched the current authenticated session.");
        }

        return TypedResults.Ok(SettingsJson.Read(userSettings));
    }
}
