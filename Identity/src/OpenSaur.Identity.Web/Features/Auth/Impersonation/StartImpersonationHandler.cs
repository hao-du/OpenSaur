using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
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
        SignInManager<ApplicationUser> signInManager,
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

        var additionalClaims = new List<Claim>
        {
            new(ApplicationClaimTypes.ImpersonationActive, bool.TrueString.ToLowerInvariant()),
            new(ApplicationClaimTypes.ImpersonationOriginalUserId, currentUserContext.UserId.ToString()),
            new(ApplicationClaimTypes.ImpersonationWorkspaceId, request.WorkspaceId.ToString())
        };

        await signInManager.SignInWithClaimsAsync(effectiveUser, isPersistent: false, additionalClaims);

        return Result<ImpersonationRedirectResponse>.Success(
                new ImpersonationRedirectResponse(NormalizeRedirectUrl(request.ReturnUrl)))
            .ToApiResult();
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

    private static string NormalizeRedirectUrl(string? returnUrl)
    {
        return !string.IsNullOrWhiteSpace(returnUrl) && returnUrl.StartsWith("/", StringComparison.Ordinal)
            ? returnUrl
            : "/";
    }
}
