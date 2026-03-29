namespace OpenSaur.Identity.Web.Features.Users.GetUserById;

public sealed record GetUserByIdResponse(
    Guid Id,
    string UserName,
    string Email,
    Guid WorkspaceId,
    string Description,
    bool IsActive,
    bool RequirePasswordChange,
    string UserSettings,
    string FirstName,
    string LastName);
