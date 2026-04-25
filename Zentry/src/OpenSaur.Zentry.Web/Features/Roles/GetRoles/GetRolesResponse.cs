namespace OpenSaur.Zentry.Web.Features.Roles.GetRoles;

public sealed record GetRolesResponse(
    Guid Id,
    string Name,
    string NormalizedName,
    string Description,
    bool IsActive);
