using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;

namespace OpenSaur.Identity.Web.Features.Permissions.GetPermissionById;

public static class GetPermissionByIdHandler
{
    public static async Task<IResult> HandleAsync(
        int codeId,
        PermissionRepository permissionRepository,
        CancellationToken cancellationToken)
    {
        var permissionResult = await permissionRepository.GetPermissionByCodeIdAsync(
            new GetPermissionByCodeIdRequest(codeId),
            cancellationToken);
        if (!permissionResult.IsSuccess || permissionResult.Value is null)
        {
            return permissionResult.ToApiErrorResult();
        }

        var definition = PermissionCatalog.GetDefinition(permissionResult.Value.Permission.CodeId);

        return ApiResponses.Success(
            new GetPermissionByIdResponse(
                permissionResult.Value.Permission.Id,
                permissionResult.Value.Permission.CodeId,
                permissionResult.Value.Permission.PermissionScopeId,
                permissionResult.Value.Permission.PermissionScope?.Name ?? string.Empty,
                definition.Code,
                permissionResult.Value.Permission.Name,
                permissionResult.Value.Permission.Description,
                permissionResult.Value.Permission.IsActive));
    }
}
