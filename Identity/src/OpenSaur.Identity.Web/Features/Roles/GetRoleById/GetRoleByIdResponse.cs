namespace OpenSaur.Identity.Web.Features.Roles.GetRoleById;

public sealed record GetRoleByIdResponse(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    int[] PermissionCodeIds);
