namespace OpenSaur.Zentry.Web.Features.Roles.EditRole;

public sealed record EditRoleRequest(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    IReadOnlyCollection<string>? PermissionCodes = null);
