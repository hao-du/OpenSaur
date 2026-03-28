namespace OpenSaur.Identity.Web.Features.UserRoles.GetUserAssignments;

public sealed record GetUserAssignmentsResponse(
    Guid Id,
    Guid UserId,
    string UserName,
    Guid RoleId,
    string RoleName,
    string RoleNormalizedName,
    string Description,
    bool IsActive);
