using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Profile;

public static class RequirePasswordChangeHandler
{
    public static async Task<Results<NoContent, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest("User is required.", "Changing password requires an authenticated user identifier.");
        }

        var currentUser = await dbContext.Users
            .SingleOrDefaultAsync(candidate => candidate.Id == currentUserId, cancellationToken);
        if (currentUser is null)
        {
            return AppHttpResults.NotFound("User not found.", "No user matched the authenticated identifier.");
        }

        currentUser.RequirePasswordChange = true;
        currentUser.SecurityStamp = Guid.NewGuid().ToString();
        currentUser.UpdatedBy = currentUserId;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
