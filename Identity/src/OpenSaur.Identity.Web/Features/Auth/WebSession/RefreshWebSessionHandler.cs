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

        var tokenResult = await tokenClient.RefreshAccessTokenAsync(
            refreshToken,
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
