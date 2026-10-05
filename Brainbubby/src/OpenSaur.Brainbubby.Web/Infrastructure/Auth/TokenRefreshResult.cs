namespace OpenSaur.Brainbubby.Web.Infrastructure.Auth;

public sealed record TokenRefreshResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn);
