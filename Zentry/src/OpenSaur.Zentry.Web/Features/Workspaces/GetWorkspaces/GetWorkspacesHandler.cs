using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Workspaces;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Workspaces.GetWorkspaces;

public static class GetWorkspacesHandler
{
    public static async Task<Ok<IReadOnlyList<GetWorkspacesResponse>>> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspaces = await dbContext.Workspaces
            .AsNoTracking()
            .Include(workspace => workspace.WorkspaceRoles)
            .OrderBy(workspace => workspace.Name)
            .ToListAsync(cancellationToken);

        var response = workspaces
            .Select(static workspace => new GetWorkspacesResponse(
                workspace.Id,
                workspace.Name,
                workspace.Description,
                workspace.IsActive,
                workspace.WorkspaceRoles
                    .Where(workspaceRole => workspaceRole.IsActive)
                    .Select(workspaceRole => workspaceRole.RoleId)
                    .ToList(),
                workspace.MaxActiveUsers))
            .ToList();

        return TypedResults.Ok<IReadOnlyList<GetWorkspacesResponse>>(response);
    }
}
