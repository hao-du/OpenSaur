using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Auth.WebSession;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public static class ExitImpersonationHandler
{
    public static async Task<IResult> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        UserRoleRepository userRoleRepository,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IFirstPartyOidcTokenClient tokenClient,
        IOptions<OidcOptions> oidcOptions,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var originalUserId = AuthPrincipalReader.GetImpersonationOriginalUserId(user);
        if (!AuthPrincipalReader.IsImpersonating(user) || !originalUserId.HasValue)
        {
            return Result.Validation(
                    ResultErrors.Validation(
                        "Impersonation is not active.",
                        "The current session cannot exit impersonation because no impersonation state is active."))
                .ToApiErrorResult();
        }

        var originalUser = await userManager.FindByIdAsync(originalUserId.Value.ToString());
        if (originalUser is null || !originalUser.IsActive)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The original super administrator session could not be restored.")
                .ToApiErrorResult();
        }

        var originalRolesResult = await userRoleRepository.GetActiveNormalizedRoleNamesForUserAsync(
            new GetActiveNormalizedRoleNamesForUserRequest(originalUser.Id, originalUser.WorkspaceId),
            cancellationToken);
        await signInManager.SignInAsync(originalUser, isPersistent: false);

        var tokenPrincipal = AuthSessionPrincipalFactory.Create(
            originalUser,
            originalRolesResult.Value?.NormalizedRoleNames ?? [],
            GetFirstPartyScopes(oidcOptions));
        var tokenResult = await tokenClient.IssueTokensAsync(tokenPrincipal, cancellationToken);
        if (tokenResult is null)
        {
            return Result.Failure(
                    StatusCodes.Status500InternalServerError,
                    ResultErrors.Server(
                        "Impersonation failed.",
                        "The original first-party session could not be restored."))
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
                Secure = true
            });

        return Result<ExchangeWebSessionResponse>.Success(
                new ExchangeWebSessionResponse(tokenResult.AccessToken, tokenResult.ExpiresAt))
            .ToApiResult();
    }

    private static string[] GetFirstPartyScopes(IOptions<OidcOptions> oidcOptions)
    {
        return oidcOptions.Value.FirstPartyWeb.Scope
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
}
