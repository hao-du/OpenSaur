namespace OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole;

public sealed record CreateUserRoleRequest(Guid UserId, Guid RoleId, string Description);
