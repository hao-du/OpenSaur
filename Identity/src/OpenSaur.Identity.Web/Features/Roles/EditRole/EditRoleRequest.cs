namespace OpenSaur.Identity.Web.Features.Roles.EditRole;

public sealed record EditRoleRequest(Guid Id, string Name, string Description, bool IsActive, string[] PermissionCodes);
