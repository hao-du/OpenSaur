namespace OpenSaur.Identity.Web.Features.UserRoles.GetAvailableRoles;

public sealed record GetAvailableRolesResponse(
    Guid Id,
    string Name,
    string NormalizedName,
    string Description,
    bool IsActive);
