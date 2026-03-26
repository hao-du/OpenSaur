namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public interface IFirstPartyOidcTokenClient
{
    Task<FirstPartyOidcTokenResult?> ExchangeAuthorizationCodeAsync(
        string code,
        CancellationToken cancellationToken);
}

public sealed record FirstPartyOidcTokenResult(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt);
