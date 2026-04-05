namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public sealed record StartImpersonationRequest(Guid WorkspaceId, Guid? UserId, string? ReturnUrl);
