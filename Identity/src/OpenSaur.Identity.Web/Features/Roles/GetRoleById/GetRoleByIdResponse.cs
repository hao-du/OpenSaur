namespace OpenSaur.Identity.Web.Features.Roles.GetRoleById;

public sealed record GetRoleByIdResponse(
    Guid Id,
    string Name,
    string NormalizedName,
    string Description,
    bool IsActive,
    string[] PermissionCodes);
