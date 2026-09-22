namespace OpenSaur.Zentry.Web.Features.Auth.Login;

public sealed record LoginRequest(
    string? ReturnUrl,
    string? ImpersonatedUserId,
    string? WorkspaceId,
    bool IsAuthenticated);

