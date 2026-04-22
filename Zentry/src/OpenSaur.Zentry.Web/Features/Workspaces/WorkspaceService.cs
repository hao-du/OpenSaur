using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Workspaces;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Workspaces;

public sealed class WorkspaceService(ApplicationDbContext dbContext)
{
    public async Task ApplyWorkspaceRoleAssignmentsAsync(
        Workspace workspace,
        IEnumerable<Guid> selectedActiveRoleIds,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var selectedRoleIds = selectedActiveRoleIds.Distinct().ToArray();
        var activeWorkspaceRoles = workspace.WorkspaceRoles
            .Where(workspaceRole => workspaceRole.IsActive)
            .ToList();

        var roleIdsToDeactivate = activeWorkspaceRoles
            .Where(workspaceRole => !selectedRoleIds.Contains(workspaceRole.RoleId))
            .Select(workspaceRole => workspaceRole.RoleId)
            .ToHashSet();

        foreach (var workspaceRole in activeWorkspaceRoles.Where(workspaceRole => roleIdsToDeactivate.Contains(workspaceRole.RoleId)))
        {
            workspaceRole.IsActive = false;
            workspaceRole.UpdatedBy = currentUserId;
        }

        foreach (var roleId in selectedRoleIds.Except(activeWorkspaceRoles.Select(workspaceRole => workspaceRole.RoleId)))
        {
            var existingWorkspaceRole = workspace.WorkspaceRoles.SingleOrDefault(workspaceRole => workspaceRole.RoleId == roleId);
            if (existingWorkspaceRole is not null)
            {
                existingWorkspaceRole.IsActive = true;
                existingWorkspaceRole.UpdatedBy = currentUserId;
                continue;
            }

            workspace.WorkspaceRoles.Add(new WorkspaceRole
            {
                Workspace = workspace,
                RoleId = roleId,
                Description = $"Role availability for {workspace.Name}.",
                CreatedBy = currentUserId
            });
        }

        if (workspace.Id == Guid.Empty || roleIdsToDeactivate.Count == 0)
        {
            return;
        }

        var assignmentsToDeactivate = await dbContext.UserRoles
            .Include(userRole => userRole.User)
            .Where(userRole => userRole.IsActive && roleIdsToDeactivate.Contains(userRole.RoleId))
            .Where(userRole => userRole.User != null && userRole.User.WorkspaceId == workspace.Id)
            .ToListAsync(cancellationToken);

        foreach (var assignment in assignmentsToDeactivate)
        {
            assignment.IsActive = false;
            assignment.UpdatedBy = currentUserId;
        }
    }
}
