namespace OpenSaur.Zentry.Web.Features.Bff.Login;

public sealed record LoginRequest(
    string? ReturnUrl,
    string? ImpersonatedUserId,
    string? WorkspaceId,
    bool IsAuthenticated);
