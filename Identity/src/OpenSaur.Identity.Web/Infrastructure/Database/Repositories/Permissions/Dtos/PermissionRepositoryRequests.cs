using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;

public sealed record GetPermissionsRequest;

public sealed record GetPermissionByCodeIdRequest(int CodeId);

public sealed record GetActivePermissionsByCodeIdsRequest(IReadOnlyCollection<int> CodeIds);

public sealed record GetActivePermissionsForRoleRequest(Guid RoleId);

public sealed record GetPermissionsResponse(IReadOnlyList<Permission> Permissions);

public sealed record GetPermissionByCodeIdResponse(Permission Permission);

public sealed record GetActivePermissionsByCodeIdsResponse(IReadOnlyList<Permission> Permissions);

public sealed record GetActivePermissionsForRoleResponse(IReadOnlyList<Permission> Permissions);
