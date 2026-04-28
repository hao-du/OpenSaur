namespace OpenSaur.Zentry.Web.Features.Users.EditUser;

public sealed record EditUserRequest(
    Guid Id,
    string UserName,
    string Email,
    string FirstName,
    string LastName,
    string Description,
    bool IsActive,
    bool RequirePasswordChange);
