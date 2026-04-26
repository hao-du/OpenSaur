using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Features.Profile;

public static class CurrentProfileHandler
{
    private const string WorkspaceIdClaimType = "workspace_id";
    private const string ImpersonationOriginalUserIdClaimType = "impersonation_original_user_id";

    public static async Task<Ok<CurrentProfileResponse>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var firstName = string.Empty;
        var lastName = string.Empty;
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId != Guid.Empty)
        {
            var currentUser = await dbContext.Users
                .AsNoTracking()
                .Where(candidate => candidate.Id == currentUserId)
                .Select(candidate => new
                {
                    candidate.FirstName,
                    candidate.LastName
                })
                .SingleOrDefaultAsync(cancellationToken);

            if (currentUser is not null)
            {
                firstName = currentUser.FirstName;
                lastName = currentUser.LastName;
            }
        }

        var workspaceName = "Protected workspace";
        var workspaceIdValue = user.FindFirst(WorkspaceIdClaimType)?.Value;
        if (Guid.TryParse(workspaceIdValue, out var workspaceId))
        {
            workspaceName = await dbContext.Workspaces
                .AsNoTracking()
                .Where(workspace => workspace.Id == workspaceId)
                .Select(workspace => workspace.Name)
                .SingleOrDefaultAsync(cancellationToken)
                ?? workspaceName;
        }

        return TypedResults.Ok(new CurrentProfileResponse(
            firstName,
            lastName,
            workspaceName,
            user.HasClaim(claim =>
                claim.Type == ImpersonationOriginalUserIdClaimType
                && !string.IsNullOrWhiteSpace(claim.Value))));
    }
}
