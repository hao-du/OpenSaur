using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Auth.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Database;
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
        CurrentUserContext currentUserContext,
        IValidator<StartImpersonationRequest> validator,
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        FirstPartyImpersonationBridge impersonationBridge,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        if (await ValidateStartRequestAsync(request, currentUserContext, dbContext, userManager, cancellationToken) is { } validationResult)
        {
            return validationResult;
        }

        var redirectUrl = impersonationBridge.BuildStartRedirectUrl(
            currentUserContext.UserId,
            request.WorkspaceId,
            request.UserId,
            httpContext.BuildFirstPartyRedirectUri(),
            request.ReturnUrl);

        return Result<ImpersonationRedirectResponse>.Success(new ImpersonationRedirectResponse(redirectUrl))
            .ToApiResult();
    }

    public static async Task<IResult> HandleRedirectAsync(
        string command,
        HttpContext httpContext,
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        FirstPartyImpersonationBridge impersonationBridge,
        CancellationToken cancellationToken)
    {
        var bridgeCommand = impersonationBridge.ReadCommand(command);
        if (bridgeCommand is null || bridgeCommand.Action != "start" || !bridgeCommand.WorkspaceId.HasValue)
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

        var authenticatedUserId = AuthPrincipalReader.GetUserId(authenticationResult.Principal);
        if (string.IsNullOrWhiteSpace(authenticatedUserId))
        {
            return await IssuerAuthenticationFlow.SignOutAndChallengeIssuerLoginAsync(httpContext);
        }

        var authenticatedUser = await userManager.FindByIdAsync(authenticatedUserId);
        if (authenticatedUser is null || !authenticatedUser.IsActive)
        {
            return await IssuerAuthenticationFlow.SignOutAndChallengeIssuerLoginAsync(httpContext);
        }

        if (authenticatedUser.Id != bridgeCommand.ActorUserId)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The issuer login did not match the impersonation request.")
                .ToApiErrorResult();
        }

        var currentUserContext = new CurrentUserContext(
            authenticatedUser.Id,
            authenticatedUser.WorkspaceId,
            IsSuperAdministrator: false,
            IsImpersonating: AuthPrincipalReader.IsImpersonating(authenticationResult.Principal));

        if (await ValidateStartRequestAsync(
                new StartImpersonationRequest(bridgeCommand.WorkspaceId.Value, bridgeCommand.UserId, bridgeCommand.ReturnUrl),
                currentUserContext,
                dbContext,
                userManager,
                cancellationToken) is { } validationResult)
        {
            return validationResult;
        }

        var effectiveUser = await ResolveEffectiveUserAsync(
            bridgeCommand.WorkspaceId.Value,
            bridgeCommand.UserId,
            currentUserContext.UserId,
            userManager,
            cancellationToken);
        if (effectiveUser is null)
        {
            return Result.NotFound(
                    "User not found.",
                    "No active workspace user or super administrator matched the provided identifier.")
                .ToApiErrorResult();
        }

        var additionalClaims = new List<Claim>
        {
            new(ApplicationClaimTypes.ImpersonationActive, bool.TrueString.ToLowerInvariant()),
            new(ApplicationClaimTypes.ImpersonationOriginalUserId, currentUserContext.UserId.ToString()),
            new(ApplicationClaimTypes.ImpersonationWorkspaceId, bridgeCommand.WorkspaceId.Value.ToString())
        };

        await signInManager.SignInWithClaimsAsync(effectiveUser, isPersistent: false, additionalClaims);

        return Results.Redirect(impersonationBridge.BuildAuthorizeUrl(bridgeCommand));
    }

    private static async Task<IResult?> ValidateStartRequestAsync(
        StartImpersonationRequest request,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        if (currentUserContext.IsImpersonating)
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

        var effectiveUser = await ResolveEffectiveUserAsync(
            request.WorkspaceId,
            request.UserId,
            currentUserContext.UserId,
            userManager,
            cancellationToken);
        if (effectiveUser is null)
        {
            return Result.NotFound(
                    "User not found.",
                    "No active workspace user or super administrator matched the provided identifier.")
                .ToApiErrorResult();
        }

        return null;
    }

    private static async Task<ApplicationUser?> ResolveEffectiveUserAsync(
        Guid workspaceId,
        Guid? userId,
        Guid currentUserId,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        var normalizedSuperAdministrator = SystemRoles.NormalizedSuperAdministrator;
        var spacedNormalizedSuperAdministrator = SystemRoles.SuperAdministrator.ToUpperInvariant();

        if (!userId.HasValue)
        {
            return await userManager.FindByIdAsync(currentUserId.ToString());
        }

        return await userManager.Users.SingleOrDefaultAsync(
            candidate => candidate.Id == userId.Value
                         && candidate.IsActive
                         && (candidate.WorkspaceId == workspaceId
                             || candidate.UserRoles.Any(
                                 assignment => assignment.IsActive
                                               && assignment.Role != null
                                               && assignment.Role.IsActive
                                               && (assignment.Role.NormalizedName == normalizedSuperAdministrator
                                                   || assignment.Role.NormalizedName == spacedNormalizedSuperAdministrator))),
            cancellationToken);
    }
}
