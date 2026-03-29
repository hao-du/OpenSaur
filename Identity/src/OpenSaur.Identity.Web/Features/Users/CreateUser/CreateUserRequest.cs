namespace OpenSaur.Identity.Web.Features.Users.CreateUser;

public sealed record CreateUserRequest(
    string UserName,
    string Email,
    string Password,
    string Description,
    string UserSettings,
    string FirstName = "",
    string LastName = "");
