namespace OpenSaur.Identity.Web.Features.UserRoles.GetAssignmentCandidates;

public sealed record GetAssignmentCandidatesResponse(
    Guid UserId,
    string UserName,
    string Email,
    Guid WorkspaceId,
    string WorkspaceName);
