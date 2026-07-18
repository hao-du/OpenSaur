namespace OpenSaur.Zentry.Web.Features.Users.CreateUser;

public sealed record CreateUserRequest(
    string UserName,
    string Email,
    string FirstName,
    string LastName,
    string Description,
    string Password,
    bool RequirePasswordChange = true);
