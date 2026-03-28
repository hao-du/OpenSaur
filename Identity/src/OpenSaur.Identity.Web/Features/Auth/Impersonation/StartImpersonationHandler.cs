using System.Security.Claims;
using FluentValidation;
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
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public static class StartImpersonationHandler
{
    public static async Task<IResult> HandleAsync(
        StartImpersonationRequest request,
        ClaimsPrincipal user,
        CurrentUserContext currentUserContext,
        IValidator<StartImpersonationRequest> validator,
        ApplicationDbContext dbContext,
        UserRoleRepository userRoleRepository,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IFirstPartyOidcTokenClient tokenClient,
        IOptions<OidcOptions> oidcOptions,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        if (AuthPrincipalReader.IsImpersonating(user))
        {
            return Result.Conflict(
                    "Impersonation already active.",
                    "Exit the current impersonation session before starting another one.")
                .ToApiErrorResult();
        }

        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .SingleOrDefaultAsync(
                candidate => candidate.Id == request.WorkspaceId && candidate.IsActive,
                cancellationToken);
        if (workspace is null)
        {
            return Result.NotFound(
                    "Workspace not found.",
                    "No active workspace matched the provided identifier.")
                .ToApiErrorResult();
        }

        var originalUser = await userManager.FindByIdAsync(currentUserContext.UserId.ToString());
        if (originalUser is null || !originalUser.IsActive)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The current super administrator session is no longer valid.")
                .ToApiErrorResult();
        }

        var effectiveUser = request.UserId.HasValue
            ? await userManager.Users.SingleOrDefaultAsync(
                candidate => candidate.Id == request.UserId.Value
                             && candidate.IsActive
                             && (candidate.WorkspaceId == request.WorkspaceId
                                 || candidate.UserRoles.Any(
                                     assignment => assignment.IsActive
                                                   && assignment.Role != null
                                                   && assignment.Role.IsActive
                                                   && assignment.Role.NormalizedName != null
                                                   && assignment.Role.NormalizedName.Replace(" ", string.Empty) == SystemRoles.NormalizedSuperAdministrator)),
                cancellationToken)
            : originalUser;
        if (effectiveUser is null)
        {
            return Result.NotFound(
                    "User not found.",
                    "No active workspace user or super administrator matched the provided identifier.")
                .ToApiErrorResult();
        }

        var effectiveRolesResult = await userRoleRepository.GetActiveNormalizedRoleNamesForUserAsync(
            new GetActiveNormalizedRoleNamesForUserRequest(effectiveUser.Id),
            cancellationToken);
        var additionalClaims = new List<Claim>
        {
            new(ApplicationClaimTypes.ImpersonationActive, bool.TrueString.ToLowerInvariant()),
            new(ApplicationClaimTypes.ImpersonationOriginalUserId, currentUserContext.UserId.ToString()),
            new(ApplicationClaimTypes.ImpersonationWorkspaceId, request.WorkspaceId.ToString())
        };

        await signInManager.SignInWithClaimsAsync(effectiveUser, isPersistent: false, additionalClaims);

        var tokenPrincipal = AuthSessionPrincipalFactory.Create(
            effectiveUser,
            effectiveRolesResult.Value?.NormalizedRoleNames ?? [],
            GetFirstPartyScopes(oidcOptions),
            workspaceOverrideId: request.WorkspaceId,
            isImpersonating: true,
            impersonationOriginalUserId: currentUserContext.UserId);
        var tokenResult = await tokenClient.IssueTokensAsync(tokenPrincipal, cancellationToken);
        if (tokenResult is null)
        {
            return Result.Failure(
                    StatusCodes.Status500InternalServerError,
                    ResultErrors.Server(
                        "Impersonation failed.",
                        "The impersonated first-party session could not be established."))
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
