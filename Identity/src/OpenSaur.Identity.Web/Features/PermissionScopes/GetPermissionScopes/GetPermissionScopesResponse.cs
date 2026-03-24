namespace OpenSaur.Identity.Web.Features.PermissionScopes.GetPermissionScopes;

public sealed record GetPermissionScopesResponse(
    Guid Id,
    string Name,
    string Description,
    bool IsActive);
