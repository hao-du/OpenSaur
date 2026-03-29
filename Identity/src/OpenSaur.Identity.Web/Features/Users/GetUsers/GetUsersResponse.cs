namespace OpenSaur.Identity.Web.Features.Users.GetUsers;

public sealed record GetUsersResponse(
    Guid Id,
    string UserName,
    string Email,
    Guid WorkspaceId,
    bool IsActive,
    bool RequirePasswordChange,
    string FirstName,
    string LastName,
    IReadOnlyList<GetUsersRoleResponse> Roles);
