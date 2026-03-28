using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Services;

public sealed class UserAuthorizationService(
    ApplicationDbContext dbContext,
    PermissionAuthorizationService permissionAuthorizationService)
{
    public async Task<bool> HasWorkspaceAccessAsync(
        CurrentUserContext currentUserContext,
        bool restrictToSuperAdministrator,
        bool allowImpersonatedSuperAdministrator = false,
        CancellationToken cancellationToken = default)
    {
        if (restrictToSuperAdministrator)
        {
            if (allowImpersonatedSuperAdministrator)
            {
                return currentUserContext.IsSuperAdministrator;
            }

            return currentUserContext.HasGlobalWorkspaceScope;
        }

        if (currentUserContext.HasGlobalWorkspaceScope)
        {
            return true;
        }

        return await dbContext.Workspaces
            .AsNoTracking()
            .AnyAsync(
                workspace => workspace.Id == currentUserContext.WorkspaceId && workspace.IsActive,
                cancellationToken);
    }

    public async Task<bool> CanManageUsersAsync(
        CurrentUserContext currentUserContext,
        CancellationToken cancellationToken = default)
    {
        if (currentUserContext.HasGlobalWorkspaceScope)
        {
            return false;
        }

        var workspaceName = await dbContext.Workspaces
            .AsNoTracking()
            .Where(workspace => workspace.Id == currentUserContext.WorkspaceId && workspace.IsActive)
            .Select(workspace => workspace.Name)
            .SingleOrDefaultAsync(cancellationToken);
        if (workspaceName is null)
        {
            return false;
        }

        if (currentUserContext.IsSuperAdministrator)
        {
            return true;
        }

        if (string.Equals(workspaceName, SystemWorkspaces.Personal, StringComparison.Ordinal))
        {
            return false;
        }

        return await permissionAuthorizationService.HasPermissionAsync(
            currentUserContext.UserId,
            PermissionCode.Administrator_CanManage,
            cancellationToken);
    }
}
