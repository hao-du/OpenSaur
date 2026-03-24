namespace OpenSaur.Identity.Web.Domain.Permissions;

public sealed record PermissionDefinition(
    int CodeId,
    Guid PermissionScopeId,
    string Code,
    string Name,
    string Description,
    int Rank);
