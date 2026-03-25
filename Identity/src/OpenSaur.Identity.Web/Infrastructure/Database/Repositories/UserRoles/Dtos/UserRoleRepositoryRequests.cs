using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;

public sealed record GetAccessibleUserRolesRequest(CurrentUserContext CurrentUserContext);

public sealed record GetAccessibleUserRoleByIdRequest(
    Guid UserRoleId,
    CurrentUserContext CurrentUserContext,
    bool TrackChanges = false);

public sealed record GetUserRolesByUserAndRoleRequest(
    Guid UserId,
    Guid RoleId,
    Guid? ExcludedUserRoleId = null);

public sealed record GetAccessibleUserRolesResponse(IReadOnlyList<ApplicationUserRole> UserRoles);

public sealed record GetAccessibleUserRoleByIdResponse(ApplicationUserRole UserRole);

public sealed record GetUserRolesByUserAndRoleResponse(IReadOnlyList<ApplicationUserRole> UserRoles);
