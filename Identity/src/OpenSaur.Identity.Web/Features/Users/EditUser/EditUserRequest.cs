namespace OpenSaur.Identity.Web.Features.Users.EditUser;

public sealed record EditUserRequest(
    Guid Id,
    string UserName,
    string Email,
    string Description,
    bool IsActive,
    string UserSettings,
    string FirstName = "",
    string LastName = "");
