namespace OpenSaur.Identity.Web.Features.UserRoles.GetUserRoles;

public sealed record GetUserRolesResponse(
    Guid Id,
    Guid UserId,
    string UserName,
    Guid RoleId,
    string RoleName,
    string Description,
    bool IsActive);
