namespace OpenSaur.Zentry.Web.Features.Workspaces.GetAssignableRoles;

public sealed record GetAssignableRolesResponse(
    Guid Id,
    string Name,
    string NormalizedName,
    string Description,
    bool IsActive);
