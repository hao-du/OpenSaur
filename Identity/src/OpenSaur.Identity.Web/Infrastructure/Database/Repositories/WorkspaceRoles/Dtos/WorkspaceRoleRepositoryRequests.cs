using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles.Dtos;

public sealed record GetActiveWorkspaceRolesRequest(Guid WorkspaceId);

public sealed record GetActiveWorkspaceRolesResponse(IReadOnlyList<ApplicationRole> Roles);

public sealed record HasActiveWorkspaceRoleRequest(Guid WorkspaceId, Guid RoleId);

public sealed record HasActiveWorkspaceRoleResponse(bool Exists);
