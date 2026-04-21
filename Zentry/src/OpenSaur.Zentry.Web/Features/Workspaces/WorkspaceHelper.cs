using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenSaur.Zentry.Web.Domain.Identity;
using OpenSaur.Zentry.Web.Domain.Workspaces;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Workspaces;

internal static class WorkspaceHelper
{
    public const string NormalizedSuperAdministrator = "SUPERADMINISTRATOR";

    public static Guid GetCurrentUserId(ClaimsPrincipal user)
    {
        var subject = user.FindFirstValue(OpenIddictConstants.Claims.Subject)
                      ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(subject, out var userId) ? userId : Guid.Empty;
    }

    public static bool IsSuperAdministrator(string? normalizedRoleName)
    {
        return string.Equals(normalizedRoleName, NormalizedSuperAdministrator, StringComparison.Ordinal);
    }

    public static async Task<List<Guid>> GetSelectedActiveRoleIdsAsync(
        ApplicationDbContext dbContext,
        IEnumerable<Guid>? selectedRoleIds,
        CancellationToken cancellationToken)
    {
        var roleIds = selectedRoleIds?.Distinct().ToArray() ?? [];
        if (roleIds.Length == 0)
        {
            return [];
        }

        return await dbContext.Roles
            .AsNoTracking()
            .Where(role => role.IsActive && roleIds.Contains(role.Id))
            .Where(role => role.NormalizedName != NormalizedSuperAdministrator)
            .Select(role => role.Id)
            .ToListAsync(cancellationToken);
    }

    public static async Task ApplyWorkspaceRoleAssignmentsAsync(
        ApplicationDbContext dbContext,
        Workspace workspace,
        IEnumerable<Guid>? selectedRoleIds,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var selectedActiveRoleIds = await GetSelectedActiveRoleIdsAsync(dbContext, selectedRoleIds, cancellationToken);
        var activeWorkspaceRoles = workspace.WorkspaceRoles
            .Where(workspaceRole => workspaceRole.IsActive)
            .ToList();

        var roleIdsToDeactivate = activeWorkspaceRoles
            .Where(workspaceRole => !selectedActiveRoleIds.Contains(workspaceRole.RoleId))
            .Select(workspaceRole => workspaceRole.RoleId)
            .ToHashSet();

        foreach (var workspaceRole in activeWorkspaceRoles.Where(workspaceRole => roleIdsToDeactivate.Contains(workspaceRole.RoleId)))
        {
            workspaceRole.IsActive = false;
            workspaceRole.UpdatedBy = currentUserId;
        }

        foreach (var roleId in selectedActiveRoleIds.Except(activeWorkspaceRoles.Select(workspaceRole => workspaceRole.RoleId)))
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
                WorkspaceId = workspace.Id,
                RoleId = roleId,
                Description = $"Role availability for {workspace.Name}.",
                CreatedBy = currentUserId
            });
        }

        if (roleIdsToDeactivate.Count == 0)
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
