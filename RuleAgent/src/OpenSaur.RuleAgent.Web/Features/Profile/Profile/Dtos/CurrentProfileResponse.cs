namespace OpenSaur.RuleAgent.Web.Features.Profile.Profile.Dtos;

public sealed record CurrentProfileResponse(
    Guid Id,
    Guid WorkspaceId,
    string Email,
    string UserName,
    string FirstName,
    string LastName,
    bool IsSuperAdministrator,
    string[] Roles,
    string[] Permissions);
