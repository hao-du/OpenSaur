using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth.Dashboard;

public static class GetDashboardSummaryHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (currentUserContext.HasGlobalWorkspaceScope)
        {
            var workspaceCount = await dbContext.Workspaces.CountAsync(cancellationToken);
            var activeWorkspaceCount = await dbContext.Workspaces.CountAsync(workspace => workspace.IsActive, cancellationToken);
            var activeUserCount = await dbContext.Users.CountAsync(user => user.IsActive, cancellationToken);
            var inactiveUserCount = await dbContext.Users.CountAsync(user => !user.IsActive, cancellationToken);
            var availableRoleCount = await dbContext.Roles.CountAsync(role => role.IsActive, cancellationToken);

            return ApiResponses.Success(
                new AuthDashboardResponse(
                    "global",
                    null,
                    workspaceCount,
                    activeWorkspaceCount,
                    activeUserCount,
                    inactiveUserCount,
                    availableRoleCount,
                    null));
        }

        var workspaceSummary = await dbContext.Workspaces
            .AsNoTracking()
            .Where(workspace => workspace.Id == currentUserContext.WorkspaceId)
            .Select(workspace => new
            {
                workspace.Name,
                workspace.MaxActiveUsers
            })
            .SingleOrDefaultAsync(cancellationToken);

        var activeUserCountForWorkspace = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.WorkspaceId == currentUserContext.WorkspaceId && user.IsActive)
            .CountAsync(cancellationToken);
        var inactiveUserCountForWorkspace = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.WorkspaceId == currentUserContext.WorkspaceId && !user.IsActive)
            .CountAsync(cancellationToken);
        var availableRoleCountForWorkspace = await dbContext.WorkspaceRoles
            .AsNoTracking()
            .Where(workspaceRole => workspaceRole.WorkspaceId == currentUserContext.WorkspaceId && workspaceRole.IsActive)
            .Join(
                dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                workspaceRole => workspaceRole.RoleId,
                role => role.Id,
                (_, role) => role.Id)
            .Distinct()
            .CountAsync(cancellationToken);

        return ApiResponses.Success(
            new AuthDashboardResponse(
                "workspace",
                workspaceSummary?.Name ?? "Protected workspace",
                1,
                workspaceSummary is null ? 0 : 1,
                activeUserCountForWorkspace,
                inactiveUserCountForWorkspace,
                availableRoleCountForWorkspace,
                workspaceSummary?.MaxActiveUsers));
    }
}
