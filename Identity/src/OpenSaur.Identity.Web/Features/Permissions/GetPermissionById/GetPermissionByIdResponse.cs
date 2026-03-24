namespace OpenSaur.Identity.Web.Features.Permissions.GetPermissionById;

public sealed record GetPermissionByIdResponse(
    Guid Id,
    int CodeId,
    Guid PermissionScopeId,
    string PermissionScopeName,
    string Code,
    string Name,
    string Description,
    bool IsActive);
