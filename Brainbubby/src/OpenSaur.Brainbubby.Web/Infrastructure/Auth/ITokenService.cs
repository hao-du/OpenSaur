namespace OpenSaur.Brainbubby.Web.Infrastructure.Auth;

public interface ITokenService
{
    Task<TokenRefreshResult?> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
}
