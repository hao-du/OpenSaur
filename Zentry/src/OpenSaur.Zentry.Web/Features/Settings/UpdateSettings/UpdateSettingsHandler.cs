using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Features.Settings.Dtos;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Settings.UpdateSettings;

public static class UpdateSettingsHandler
{
    public static async Task<Results<Ok<SettingsResponse>, ValidationProblem, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        UpdateSettingsRequest request,
        IValidator<UpdateSettingsRequest> validator,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest("User is required.", "Settings require an authenticated user identifier.");
        }

        var currentUser = await dbContext.Users
            .SingleOrDefaultAsync(candidate => candidate.Id == currentUserId, cancellationToken);
        if (currentUser is null)
        {
            return AppHttpResults.NotFound("User not found.", "No user matched the current authenticated session.");
        }

        currentUser.UserSettings = SettingsJson.Merge(currentUser.UserSettings, request);
        currentUser.UpdatedBy = currentUserId;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new SettingsResponse(request.Locale, request.TimeZone));
    }
}
