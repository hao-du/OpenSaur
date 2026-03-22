namespace OpenSaur.Identity.Web.Features.Users.ChangeWorkspace;

public sealed record ChangeUserWorkspaceRequest(Guid UserId, Guid WorkspaceId);
