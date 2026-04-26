namespace OpenSaur.Zentry.Web.Features.Workspaces.GetUsersForImpersonationByWorkspaceId;

public sealed record GetUsersForImpersonationByWorkspaceIdResponse(
    Guid WorkspaceId,
    string WorkspaceName,
    IReadOnlyList<UserForImpersonationResponse> Users);

public sealed record UserForImpersonationResponse(
    Guid Id,
    string UserName,
    string Email);
