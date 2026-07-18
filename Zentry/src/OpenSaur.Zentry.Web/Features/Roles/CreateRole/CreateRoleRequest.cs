namespace OpenSaur.Zentry.Web.Features.Roles.CreateRole;

public sealed record CreateRoleRequest(
    string Name,
    string Description,
    IReadOnlyCollection<string>? PermissionCodes = null);
