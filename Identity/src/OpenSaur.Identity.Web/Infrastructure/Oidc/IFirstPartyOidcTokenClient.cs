namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public interface IFirstPartyOidcTokenClient
{
    Task<FirstPartyOidcTokenResult?> ExchangeAuthorizationCodeAsync(
        string code,
        string redirectUri,
        CancellationToken cancellationToken);

    Task<FirstPartyOidcTokenResult?> RefreshAccessTokenAsync(
        string refreshToken,
        string redirectUri,
        CancellationToken cancellationToken);
}

public sealed record FirstPartyOidcTokenResult(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt);
