using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Workspaces.GetUsersForImpersonationByWorkspaceId;

public static class GetUsersForImpersonationByWorkspaceIdHandler
{
    public static async Task<Results<Ok<GetUsersForImpersonationByWorkspaceIdResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid workspaceId,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .Where(candidate => candidate.Id == workspaceId && candidate.IsActive)
            .Select(candidate => new
            {
                candidate.Id,
                candidate.Name
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (workspace is null)
        {
            return AppHttpResults.NotFound("Workspace not found.", "No active workspace matched the provided identifier.");
        }

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.IsActive
                && (candidate.WorkspaceId == workspaceId
                    || candidate.UserRoles.Any(userRole =>
                        userRole.IsActive
                        && userRole.Role != null
                        && userRole.Role.NormalizedName == Constants.NormalizedSuperAdministrator)))
            .OrderBy(candidate => candidate.UserName)
            .Select(candidate => new UserForImpersonationResponse(
                candidate.Id,
                candidate.UserName ?? string.Empty,
                candidate.Email ?? string.Empty))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new GetUsersForImpersonationByWorkspaceIdResponse(workspace.Id, workspace.Name, users));
    }
}
