using System.Security.Claims;
using OpenIddict.Abstractions;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Auth.Me;

public static class GetCurrentUserHandler
{
    public static async Task<IResult> Handle(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        UserAuthorizationService userAuthorizationService,
        CancellationToken cancellationToken)
    {
        var roles = user.FindAll(ApplicationClaimTypes.Role)
            .Select(static claim => claim.Value)
            .ToArray();
        var isImpersonating = AuthPrincipalReader.IsImpersonating(user);
        var currentUserContext = CurrentUserContext.Create(user);
        var currentUserProfile = await ResolveCurrentUserProfileAsync(user, dbContext, cancellationToken);
        if (currentUserContext is null || currentUserProfile is null)
        {
            return Result.Unauthorized(
                    "Authentication is required.",
                    "The request requires a valid authenticated API session or bearer token.")
                .ToApiErrorResult();
        }

        var workspaceName = await ResolveWorkspaceNameAsync(
            user,
            roles,
            dbContext,
            cancellationToken);
        var canManageUsers = await userAuthorizationService.CanManageUsersAsync(
            currentUserContext,
            cancellationToken);

        return ApiResponses.Success(
            new AuthMeResponse(
                AuthPrincipalReader.GetUserId(user),
                currentUserProfile.UserName ?? user.Identity?.Name,
                currentUserProfile.Email ?? user.FindFirstValue(OpenIddictConstants.Claims.Email),
                roles,
                AuthPrincipalReader.GetRequirePasswordChange(user),
                workspaceName,
                isImpersonating,
                canManageUsers,
                currentUserProfile.FirstName,
                currentUserProfile.LastName));
    }

    private static async Task<CurrentUserProfile?> ResolveCurrentUserProfileAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(AuthPrincipalReader.GetUserId(user), out var userId))
        {
            return null;
        }

        return await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == userId)
            .Select(candidate => new CurrentUserProfile(
                candidate.UserName,
                candidate.Email,
                candidate.FirstName,
                candidate.LastName))
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static async Task<string> ResolveWorkspaceNameAsync(
        ClaimsPrincipal user,
        IReadOnlyCollection<string> roles,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (roles.Any(SystemRoles.IsSuperAdministratorValue)
            && !AuthPrincipalReader.IsImpersonating(user))
        {
            return "All workspaces";
        }

        var workspaceId = AuthPrincipalReader.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return "Protected workspace";
        }

        return await dbContext.Workspaces
                   .AsNoTracking()
                   .Where(workspace => workspace.Id == workspaceId.Value)
                   .Select(workspace => workspace.Name)
                   .SingleOrDefaultAsync(cancellationToken)
               ?? "Protected workspace";
    }

    private sealed record CurrentUserProfile(
        string? UserName,
        string? Email,
        string FirstName,
        string LastName);
}
