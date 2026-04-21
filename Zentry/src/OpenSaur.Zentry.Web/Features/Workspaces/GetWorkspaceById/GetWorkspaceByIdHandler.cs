using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Workspaces.GetWorkspaceById;

public static class GetWorkspaceByIdHandler
{
    public static async Task<Results<Ok<GetWorkspaceByIdResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .Include(candidate => candidate.WorkspaceRoles)
            .SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (workspace is null)
        {
            return AppHttpResults.NotFound("Workspace not found.", "No workspace matched the provided identifier.");
        }

        return TypedResults.Ok(new GetWorkspaceByIdResponse(
            workspace.Id,
            workspace.Name,
            workspace.Description,
            workspace.IsActive,
            workspace.WorkspaceRoles
                .Where(workspaceRole => workspaceRole.IsActive)
                .Select(workspaceRole => workspaceRole.RoleId)
                .ToList(),
            workspace.MaxActiveUsers));
    }
}
