using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.PermissionScopes.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.PermissionScopes;

public sealed class PermissionScopeRepository(ApplicationDbContext dbContext)
{
    public async Task<Result<GetPermissionScopesResponse>> GetPermissionScopesAsync(
        GetPermissionScopesRequest request,
        CancellationToken cancellationToken)
    {
        var permissionScopes = await dbContext.PermissionScopes
            .AsNoTracking()
            .OrderBy(permissionScope => permissionScope.Name)
            .ToListAsync(cancellationToken);

        return Result<GetPermissionScopesResponse>.Success(new GetPermissionScopesResponse(permissionScopes));
    }
}
