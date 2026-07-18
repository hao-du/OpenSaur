namespace OpenSaur.Zentry.Web.Features.Users.GetUserRoles;

public sealed record GetUserRolesResponse(
    Guid UserId,
    string UserName,
    IReadOnlyList<GetUserRolesRoleResponse> Roles);

public sealed record GetUserRolesRoleResponse(
    Guid RoleId,
    string Name,
    string Description,
    bool IsAssigned);
