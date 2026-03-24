namespace OpenSaur.Identity.Web.Features.Permissions.GetPermissions;

public sealed record GetPermissionsResponse(
    Guid Id,
    int CodeId,
    Guid PermissionScopeId,
    string PermissionScopeName,
    string Code,
    string Name,
    string Description,
    bool IsActive);
