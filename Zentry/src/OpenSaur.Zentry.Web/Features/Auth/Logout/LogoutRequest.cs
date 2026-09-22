namespace OpenSaur.Zentry.Web.Features.Auth.Logout;

public sealed record LogoutRequest(
    string? ReturnUrl,
    bool IsAuthenticated);

