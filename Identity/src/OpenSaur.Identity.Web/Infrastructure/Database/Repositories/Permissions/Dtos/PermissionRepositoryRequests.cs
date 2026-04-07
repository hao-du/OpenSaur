using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;

public sealed record GetPermissionsRequest;

public sealed record GetPermissionByCodeRequest(string Code);

public sealed record GetActivePermissionsByCodesRequest(IReadOnlyCollection<string> Codes);

public sealed record GetActivePermissionsForRoleRequest(Guid RoleId);

public sealed record GetPermissionsResponse(IReadOnlyList<Permission> Permissions);

public sealed record GetPermissionByCodeResponse(Permission Permission);

public sealed record GetActivePermissionsByCodesResponse(IReadOnlyList<Permission> Permissions);

public sealed record GetActivePermissionsForRoleResponse(IReadOnlyList<Permission> Permissions);
