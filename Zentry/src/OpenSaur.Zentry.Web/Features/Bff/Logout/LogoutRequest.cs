namespace OpenSaur.Zentry.Web.Features.Bff.Logout;

public sealed record LogoutRequest(
    string? ReturnUrl,
    bool IsAuthenticated);

