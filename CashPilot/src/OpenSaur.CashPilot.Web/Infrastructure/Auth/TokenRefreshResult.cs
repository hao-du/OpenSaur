namespace OpenSaur.CashPilot.Web.Infrastructure.Auth;

public sealed record TokenRefreshResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn);

