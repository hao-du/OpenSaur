using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.PermissionScopes;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.PermissionScopes.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;

namespace OpenSaur.Identity.Web.Features.PermissionScopes.GetPermissionScopes;

public static class GetPermissionScopesHandler
{
    public static async Task<IResult> HandleAsync(
        PermissionScopeRepository permissionScopeRepository,
        CancellationToken cancellationToken)
    {
        var permissionScopesResult = await permissionScopeRepository.GetPermissionScopesAsync(
            new GetPermissionScopesRequest(),
            cancellationToken);

        return permissionScopesResult.ToApiResult(
            response => response.PermissionScopes.Select(
                static permissionScope => new GetPermissionScopesResponse(
                    permissionScope.Id,
                    permissionScope.Name,
                    permissionScope.Description,
                    permissionScope.IsActive))
                .ToList());
    }
}
