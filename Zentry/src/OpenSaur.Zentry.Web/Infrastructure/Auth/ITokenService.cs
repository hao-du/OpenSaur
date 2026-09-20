namespace OpenSaur.Zentry.Web.Infrastructure.Auth;

public interface ITokenService
{
    Task<TokenRefreshResult?> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
}

