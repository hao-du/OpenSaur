namespace OpenSaur.Identity.Web.Domain.Permissions;

public sealed record PermissionScopeDefinition(
    Guid Id,
    string Name,
    string Description);
