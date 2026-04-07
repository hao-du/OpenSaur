namespace OpenSaur.Identity.Web.Domain.Permissions;

public sealed record PermissionDefinition(
    string Code,
    Guid PermissionScopeId,
    string Name,
    string Description,
    int Rank);
