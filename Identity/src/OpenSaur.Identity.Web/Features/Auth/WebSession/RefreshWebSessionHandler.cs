using Microsoft.AspNetCore.Http;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Auth.WebSession;

public static class RefreshWebSessionHandler
{
    public static async Task<IResult> HandleAsync(
        IFirstPartyOidcTokenClient tokenClient,
        HttpContext httpContext,
        ManagedOidcClientResolver managedOidcClientResolver,
        CancellationToken cancellationToken)
    {
        var refreshToken = httpContext.Request.Cookies[AuthCookieNames.Refresh];
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The current first-party session cannot be refreshed.")
                .ToApiErrorResult();
        }

        var redirectUri = await managedOidcClientResolver.BuildCurrentRedirectUriAsync(
                              httpContext.Request,
                              cancellationToken)
                          ?? throw new InvalidOperationException(
                              "No active managed OIDC client matched the current app base URI.");

        var tokenResult = await tokenClient.RefreshAccessTokenAsync(
            refreshToken,
            redirectUri,
            cancellationToken);
        if (tokenResult is null)
        {
            httpContext.DeleteFirstPartyRefreshToken();

            return Result.Unauthorized(
                    "Authentication failed.",
                    "The current first-party session cannot be refreshed.")
                .ToApiErrorResult();
        }

        httpContext.AppendFirstPartyRefreshToken(tokenResult.RefreshToken);

        return Result<ExchangeWebSessionResponse>.Success(
                new ExchangeWebSessionResponse(tokenResult.AccessToken, tokenResult.ExpiresAt))
            .ToApiResult();
    }
}
