using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Auth.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public static class ExitImpersonationHandler
{
    public static async Task<IResult> HandleAsync(
        ExitImpersonationRequest request,
        ClaimsPrincipal user,
        UserManager<ApplicationUser> userManager,
        FirstPartyImpersonationBridge impersonationBridge,
        IOptions<OidcOptions> oidcOptionsAccessor,
        HttpContext httpContext)
    {
        if (await ValidateExitRequestAsync(user, userManager) is { } validationResult)
        {
            return validationResult;
        }

        var originalUserId = AuthPrincipalReader.GetImpersonationOriginalUserId(user);
        var redirectUrl = impersonationBridge.BuildExitRedirectUrl(
            originalUserId!.Value,
            httpContext.BuildFirstPartyRedirectUri(oidcOptionsAccessor.Value),
            request.ReturnUrl);

        return Result<ImpersonationRedirectResponse>.Success(new ImpersonationRedirectResponse(redirectUrl))
            .ToApiResult();
    }

    public static async Task<IResult> HandleRedirectAsync(
        string command,
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        FirstPartyImpersonationBridge impersonationBridge)
    {
        var bridgeCommand = impersonationBridge.ReadCommand(command);
        if (bridgeCommand is null || bridgeCommand.Action != "exit")
        {
            return Result.Validation(
                    ResultErrors.Validation(
                        "Impersonation request is invalid.",
                        "The issuer could not resume the requested impersonation flow."))
                .ToApiErrorResult();
        }

        var authenticationResult = await httpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!authenticationResult.Succeeded || authenticationResult.Principal is null)
        {
            return IssuerAuthenticationFlow.ChallengeIssuerLogin(httpContext);
        }

        if (await ValidateExitRequestAsync(authenticationResult.Principal, userManager, bridgeCommand.ActorUserId) is { } validationResult)
        {
            return validationResult;
        }

        var originalUser = await userManager.FindByIdAsync(bridgeCommand.ActorUserId.ToString());
        if (originalUser is null)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The original super administrator session could not be restored.")
                .ToApiErrorResult();
        }

        if (AuthPrincipalReader.IsImpersonating(authenticationResult.Principal))
        {
            await signInManager.SignInAsync(originalUser, isPersistent: false);
        }

        return Results.Redirect(impersonationBridge.BuildCompletionUrl(bridgeCommand));
    }

    private static async Task<IResult?> ValidateExitRequestAsync(
        ClaimsPrincipal user,
        UserManager<ApplicationUser> userManager,
        Guid? expectedOriginalUserId = null)
    {
        var originalUserId = AuthPrincipalReader.GetImpersonationOriginalUserId(user);
        var currentUserId = AuthPrincipalReader.GetUserId(user);
        var expectedOriginalUserIdString = expectedOriginalUserId?.ToString();

        if (AuthPrincipalReader.IsImpersonating(user))
        {
            if (!originalUserId.HasValue
                || expectedOriginalUserId.HasValue && originalUserId.Value != expectedOriginalUserId.Value)
            {
                return Result.Unauthorized(
                        "Authentication failed.",
                        "The issuer impersonation session did not match the original administrator.")
                    .ToApiErrorResult();
            }
        }
        else if (expectedOriginalUserId.HasValue)
        {
            if (!string.Equals(currentUserId, expectedOriginalUserIdString, StringComparison.OrdinalIgnoreCase))
            {
                return Result.Unauthorized(
                        "Authentication failed.",
                        "The issuer login did not match the original administrator.")
                    .ToApiErrorResult();
            }
        }
        else
        {
            return Result.Validation(
                    ResultErrors.Validation(
                        "Impersonation is not active.",
                        "The current session cannot exit impersonation because no impersonation state is active."))
                .ToApiErrorResult();
        }

        var resolvedOriginalUserId = expectedOriginalUserId ?? originalUserId!.Value;
        var originalUser = await userManager.FindByIdAsync(resolvedOriginalUserId.ToString());
        if (originalUser is null || !originalUser.IsActive)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The original super administrator session could not be restored.")
                .ToApiErrorResult();
        }

        return null;
    }
}
