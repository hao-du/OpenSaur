namespace OpenSaur.Zentry.Web.Features.Users.GetUserById;

public sealed record GetUserByIdResponse(
    Guid Id,
    string UserName,
    string Email,
    string FirstName,
    string LastName,
    string Description,
    bool IsActive,
    bool RequirePasswordChange);
