using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public static class ExitImpersonationHandler
{
    public static async Task<IResult> HandleAsync(
        ExitImpersonationRequest request,
        ClaimsPrincipal user,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        CancellationToken cancellationToken)
    {
        if (await ValidateExitRequestAsync(user, userManager) is { } validationResult)
        {
            return validationResult;
        }

        var originalUserId = AuthPrincipalReader.GetImpersonationOriginalUserId(user);
        var originalUser = await userManager.FindByIdAsync(originalUserId!.Value.ToString());
        if (originalUser is null || !originalUser.IsActive)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The original super administrator session could not be restored.")
                .ToApiErrorResult();
        }

        await signInManager.SignInAsync(originalUser, isPersistent: false);

        return Result<ImpersonationRedirectResponse>.Success(
                new ImpersonationRedirectResponse(NormalizeRedirectUrl(request.ReturnUrl)))
            .ToApiResult();
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

    private static string NormalizeRedirectUrl(string? returnUrl)
    {
        return !string.IsNullOrWhiteSpace(returnUrl) && returnUrl.StartsWith("/", StringComparison.Ordinal)
            ? returnUrl
            : "/";
    }
}
