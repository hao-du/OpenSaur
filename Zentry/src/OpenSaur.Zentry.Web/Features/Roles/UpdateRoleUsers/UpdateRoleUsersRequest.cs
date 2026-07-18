namespace OpenSaur.Zentry.Web.Features.Roles.UpdateRoleUsers;

public sealed record UpdateRoleUsersRequest(
    Guid RoleId,
    IReadOnlyCollection<Guid>? UserIds = null);
