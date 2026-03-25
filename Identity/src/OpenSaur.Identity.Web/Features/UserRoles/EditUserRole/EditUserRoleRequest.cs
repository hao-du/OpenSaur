namespace OpenSaur.Identity.Web.Features.UserRoles.EditUserRole;

public sealed record EditUserRoleRequest(Guid Id, Guid RoleId, string Description, bool IsActive);
