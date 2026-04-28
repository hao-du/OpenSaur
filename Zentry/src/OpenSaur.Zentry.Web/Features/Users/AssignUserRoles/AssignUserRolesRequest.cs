namespace OpenSaur.Zentry.Web.Features.Users.AssignUserRoles;

public sealed record AssignUserRolesRequest(
    Guid Id,
    IReadOnlyList<Guid>? RoleIds);
