namespace OpenSaur.Identity.Web.Features.UserRoles.GetRoleCandidates;

public sealed record GetRoleCandidatesResponse(
    Guid RoleId,
    string RoleName,
    string RoleNormalizedName,
    string Description);
