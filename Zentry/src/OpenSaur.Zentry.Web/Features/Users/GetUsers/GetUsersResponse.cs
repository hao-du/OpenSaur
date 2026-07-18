namespace OpenSaur.Zentry.Web.Features.Users.GetUsers;

public sealed record GetUsersResponse(
    Guid Id,
    string UserName,
    string Email,
    string FirstName,
    string LastName,
    string Description,
    bool IsActive,
    bool RequirePasswordChange,
    IReadOnlyList<string> RoleNames);
