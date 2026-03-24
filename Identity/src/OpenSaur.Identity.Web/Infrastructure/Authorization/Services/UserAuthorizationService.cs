using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Services;

public sealed class UserAuthorizationService(ApplicationDbContext dbContext)
{
    public async Task<bool> HasWorkspaceAccessAsync(
        CurrentUserContext currentUserContext,
        bool restrictToSuperAdministrator,
        CancellationToken cancellationToken = default)
    {
        if (currentUserContext.IsSuperAdministrator)
        {
            return true;
        }

        if (restrictToSuperAdministrator)
        {
            return false;
        }

        return await dbContext.Workspaces
            .AsNoTracking()
            .AnyAsync(
                workspace => workspace.Id == currentUserContext.WorkspaceId && workspace.IsActive,
                cancellationToken);
    }
}
