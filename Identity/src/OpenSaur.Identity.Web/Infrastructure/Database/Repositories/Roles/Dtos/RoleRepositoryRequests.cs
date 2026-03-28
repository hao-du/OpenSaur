using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;

public sealed record GetRolesRequest;

public sealed record GetRoleByIdRequest(Guid RoleId, bool TrackChanges = false);

public sealed record GetActiveRolesRequest;

public sealed record GetActiveRolesByIdsRequest(IReadOnlyCollection<Guid> RoleIds);

public sealed record GetRolesResponse(IReadOnlyList<ApplicationRole> Roles);

public sealed record GetRoleByIdResponse(ApplicationRole Role);

public sealed record GetActiveRolesResponse(IReadOnlyList<ApplicationRole> Roles);

public sealed record GetActiveRolesByIdsResponse(IReadOnlyList<ApplicationRole> Roles);
