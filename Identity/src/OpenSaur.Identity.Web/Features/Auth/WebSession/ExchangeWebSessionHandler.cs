using FluentValidation;
using Microsoft.AspNetCore.Http;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Auth.WebSession;

public static class ExchangeWebSessionHandler
{
    public static async Task<IResult> HandleAsync(
        ExchangeWebSessionRequest request,
        IValidator<ExchangeWebSessionRequest> validator,
        IFirstPartyOidcTokenClient tokenClient,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var tokenResult = await tokenClient.ExchangeAuthorizationCodeAsync(request.Code, cancellationToken);
        if (tokenResult is null)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The first-party authorization callback could not be completed.")
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
