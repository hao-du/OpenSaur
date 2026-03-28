using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;

namespace OpenSaur.Identity.Web.Features.Roles.GetRoleById;

public static class GetRoleByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        RoleRepository roleRepository,
        PermissionRepository permissionRepository,
        CancellationToken cancellationToken)
    {
        var roleResult = await roleRepository.GetRoleByIdAsync(new GetRoleByIdRequest(id), cancellationToken);
        if (!roleResult.IsSuccess || roleResult.Value is null)
        {
            return roleResult.ToApiErrorResult();
        }

        var permissionsResult = await permissionRepository.GetActivePermissionsForRoleAsync(
            new GetActivePermissionsForRoleRequest(id),
            cancellationToken);

        return ApiResponses.Success(
            new GetRoleByIdResponse(
                roleResult.Value.Role.Id,
                roleResult.Value.Role.Name ?? string.Empty,
                roleResult.Value.Role.NormalizedName ?? string.Empty,
                roleResult.Value.Role.Description,
                roleResult.Value.Role.IsActive,
                permissionsResult.Value?.Permissions.Select(permission => permission.CodeId).OrderBy(codeId => codeId).ToArray() ?? []));
    }
}
