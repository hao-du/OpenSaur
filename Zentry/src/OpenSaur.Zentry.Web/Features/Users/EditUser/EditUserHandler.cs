using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Features.Users.CreateUser;
using OpenSaur.Zentry.Web.Infrastructure.Cache;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using OpenSaur.Zentry.Web.Infrastructure.Lock;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.EditUser;

public static class EditUserHandler
{
    private static readonly TimeSpan LockTimeout = TimeSpan.FromSeconds(10);

    public static async Task<Results<NoContent, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        EditUserRequest request,
        IValidator<EditUserRequest> validator,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        ICacheService cacheService,
        ILockService lockService,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User management requires a current workspace.");
        }

        var targetUser = await dbContext.Users
            .SingleOrDefaultAsync(candidate => candidate.Id == request.Id && candidate.WorkspaceId == workspaceId.Value, cancellationToken);
        if (targetUser is null)
        {
            return AppHttpResults.NotFound("User not found.", "No user in the current workspace matched the provided identifier.");
        }

        var isActivatingUser = !targetUser.IsActive && request.IsActive;
        if (isActivatingUser)
        {
            var lockAcquired = await lockService.TryAcquireLockAsync(LockKeys.WorkspaceUsers(workspaceId.Value), LockTimeout, cancellationToken);
            if (!lockAcquired)
            {
                return AppHttpResults.Conflict("Workspace is currently busy.", "Another user operation is in progress for this workspace. Please try again.");
            }

            try
            {
                var workspace = await dbContext.Workspaces
                    .AsNoTracking()
                    .Where(candidate => candidate.Id == workspaceId.Value)
                    .Select(candidate => new { candidate.MaxActiveUsers })
                    .SingleOrDefaultAsync(cancellationToken);

                if (workspace?.MaxActiveUsers.HasValue == true)
                {
                    var activeUserCount = await dbContext.Users
                        .AsNoTracking()
                        .CountAsync(candidate => candidate.WorkspaceId == workspaceId.Value && candidate.IsActive, cancellationToken);

                    if (activeUserCount >= workspace.MaxActiveUsers.Value)
                    {
                        return AppHttpResults.BadRequest(
                            "Maximum active users reached.",
                            $"Workspace has reached the maximum allowed active users limit of {workspace.MaxActiveUsers.Value}.");
                    }
                }

                return await SaveUserChangesAsync(request, targetUser, user, dbContext, cacheService, cancellationToken);
            }
            finally
            {
                await lockService.ReleaseLockAsync(LockKeys.WorkspaceUsers(workspaceId.Value), cancellationToken);
            }
        }

        return await SaveUserChangesAsync(request, targetUser, user, dbContext, cacheService, cancellationToken);
    }

    private static async Task<Results<NoContent, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> SaveUserChangesAsync(
        EditUserRequest request,
        OpenSaur.Zentry.Web.Domain.Identity.ApplicationUser targetUser,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var normalizedUserName = CreateUserHandler.NormalizeIdentityValue(request.UserName);
        var duplicateUserNameExists = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(candidate => candidate.Id != request.Id && candidate.NormalizedUserName == normalizedUserName, cancellationToken);
        if (duplicateUserNameExists)
        {
            return AppHttpResults.Conflict("User name already exists.", "A user with this user name already exists.");
        }

        targetUser.UserName = request.UserName.Trim();
        targetUser.NormalizedUserName = normalizedUserName;
        targetUser.Email = request.Email.Trim();
        targetUser.NormalizedEmail = CreateUserHandler.NormalizeIdentityValue(request.Email);
        targetUser.FirstName = request.FirstName.Trim();
        targetUser.LastName = request.LastName.Trim();
        targetUser.Description = request.Description;
        targetUser.IsActive = request.IsActive;
        targetUser.RequirePasswordChange = request.RequirePasswordChange;
        targetUser.UpdatedBy = ClaimHelper.GetCurrentUserId(user);

        await dbContext.SaveChangesAsync(cancellationToken);

        // Invalidate cached user profile so user info updates are reflected
        await cacheService.RemoveAsync(CacheKeys.UserProfile(request.Id), cancellationToken);

        return TypedResults.NoContent();
    }
}
