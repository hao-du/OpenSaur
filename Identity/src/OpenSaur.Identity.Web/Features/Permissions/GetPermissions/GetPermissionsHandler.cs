using OpenSaur.Identity.Web.Domain.Permissions;
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
                permission =>
                {
                    var definition = PermissionCatalog.GetDefinition(permission.CodeId);
                    return new GetPermissionsResponse(
                        permission.Id,
                        permission.CodeId,
                        permission.PermissionScopeId,
                        permission.PermissionScope?.Name ?? string.Empty,
                        definition.Code,
                        permission.Name,
                        permission.Description,
                        permission.IsActive);
                })
                .ToList());
    }
}
