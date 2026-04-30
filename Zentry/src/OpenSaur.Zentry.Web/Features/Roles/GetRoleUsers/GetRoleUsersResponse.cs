namespace OpenSaur.Zentry.Web.Features.Roles.GetRoleUsers;

public sealed record GetRoleUsersResponse(
    Guid RoleId,
    string RoleName,
    IReadOnlyList<GetRoleUsersUserResponse> Users);

public sealed record GetRoleUsersUserResponse(
    Guid UserId,
    string UserName,
    string Email,
    string FirstName,
    string LastName,
    bool IsAssigned);
