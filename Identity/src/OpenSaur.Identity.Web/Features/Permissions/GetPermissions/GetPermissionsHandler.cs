using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;

namespace OpenSaur.Identity.Web.Features.Permissions.GetPermissions;

public static class GetPermissionsHandler
{
    public static async Task<IResult> HandleAsync(
        PermissionRepository permissionRepository,
        CancellationToken cancellationToken)
    {
        var permissionsResult = await permissionRepository.GetPermissionsAsync(
            new GetPermissionsRequest(),
            cancellationToken);

        return permissionsResult.ToApiResult(
            response => response.Permissions.Select(
                permission => new GetPermissionsResponse(
                    permission.Id,
                    permission.PermissionScopeId,
                    permission.PermissionScope?.Name ?? string.Empty,
                    permission.Code,
                    permission.Name,
                    permission.Description,
                    permission.IsActive))
                .ToList());
    }
}
