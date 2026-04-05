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
        ManagedOidcClientResolver managedOidcClientResolver,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var redirectUri = await managedOidcClientResolver.BuildCurrentRedirectUriAsync(
                              httpContext.Request,
                              cancellationToken)
                          ?? throw new InvalidOperationException(
                              "No active managed OIDC client matched the current app base URI.");

        var tokenResult = await tokenClient.ExchangeAuthorizationCodeAsync(
            request.Code,
            redirectUri,
            cancellationToken);
        if (tokenResult is null)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The first-party authorization callback could not be completed.")
                .ToApiErrorResult();
        }

        httpContext.AppendFirstPartyRefreshToken(tokenResult.RefreshToken);

        return Result<ExchangeWebSessionResponse>.Success(
                new ExchangeWebSessionResponse(tokenResult.AccessToken, tokenResult.ExpiresAt))
            .ToApiResult();
    }
}
