using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Persistence;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Users;

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
