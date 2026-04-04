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
            httpContext.BuildFirstPartyRedirectUri(),
            cancellationToken);
        if (tokenResult is null)
        {
            httpContext.Response.Cookies.Delete(
                AuthCookieNames.Refresh,
                new CookieOptions
                {
                    HttpOnly = true,
                    IsEssential = true,
                    SameSite = SameSiteMode.Lax,
                    Secure = httpContext.Request.IsHttps
                });

            return Result.Unauthorized(
                    "Authentication failed.",
                    "The current first-party session cannot be refreshed.")
                .ToApiErrorResult();
        }

        httpContext.Response.Cookies.Append(
            AuthCookieNames.Refresh,
            tokenResult.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = httpContext.Request.IsHttps
            });

        return Result<ExchangeWebSessionResponse>.Success(
                new ExchangeWebSessionResponse(tokenResult.AccessToken, tokenResult.ExpiresAt))
            .ToApiResult();
    }
}
