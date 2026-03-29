using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles;

public sealed class WorkspaceRoleRepository(ApplicationDbContext dbContext)
{
    public async Task<Result<GetActiveWorkspaceRolesResponse>> GetActiveWorkspaceRolesAsync(
        GetActiveWorkspaceRolesRequest request,
        CancellationToken cancellationToken)
    {
        var roles = await dbContext.WorkspaceRoles
            .AsNoTracking()
            .Where(workspaceRole => workspaceRole.WorkspaceId == request.WorkspaceId && workspaceRole.IsActive)
            .Join(
                dbContext.Roles
                    .AsNoTracking()
                    .Where(role => role.IsActive),
                workspaceRole => workspaceRole.RoleId,
                role => role.Id,
                (_, role) => role)
            .OrderBy(role => role.Name)
            .ToListAsync(cancellationToken);

        return Result<GetActiveWorkspaceRolesResponse>.Success(new GetActiveWorkspaceRolesResponse(roles));
    }

    public async Task<Result<HasActiveWorkspaceRoleResponse>> HasActiveWorkspaceRoleAsync(
        HasActiveWorkspaceRoleRequest request,
        CancellationToken cancellationToken)
    {
        var exists = await dbContext.WorkspaceRoles
            .AsNoTracking()
            .Where(workspaceRole => workspaceRole.WorkspaceId == request.WorkspaceId && workspaceRole.IsActive)
            .AnyAsync(workspaceRole => workspaceRole.RoleId == request.RoleId, cancellationToken);

        return Result<HasActiveWorkspaceRoleResponse>.Success(new HasActiveWorkspaceRoleResponse(exists));
    }
}
