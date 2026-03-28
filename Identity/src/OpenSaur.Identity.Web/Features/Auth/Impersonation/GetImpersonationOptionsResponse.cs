namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public sealed record GetImpersonationOptionsResponse(
    Guid WorkspaceId,
    string WorkspaceName,
    IReadOnlyList<ImpersonationUserResponse> Users);

public sealed record ImpersonationUserResponse(Guid Id, string UserName, string Email);
