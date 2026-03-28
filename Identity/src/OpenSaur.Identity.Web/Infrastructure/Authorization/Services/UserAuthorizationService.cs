using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Services;

public sealed class UserAuthorizationService(ApplicationDbContext dbContext)
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
}
