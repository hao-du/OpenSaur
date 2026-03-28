namespace OpenSaur.Identity.Web.Features.UserRoles.GetRoleAssignments;

public sealed record GetRoleAssignmentsResponse(
    Guid Id,
    Guid UserId,
    string UserName,
    Guid WorkspaceId,
    string WorkspaceName,
    string Description,
    bool IsActive);
