namespace OpenSaur.Identity.Web.Features.Roles.CreateRole;

public sealed record CreateRoleRequest(string Name, string Description, string[] PermissionCodes);
