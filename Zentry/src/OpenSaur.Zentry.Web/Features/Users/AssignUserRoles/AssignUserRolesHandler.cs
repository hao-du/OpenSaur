using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Identity;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Cache;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using OpenSaur.Zentry.Web.Infrastructure.Lock;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.AssignUserRoles;

public static class AssignUserRolesHandler
{
    private static readonly TimeSpan LockTimeout = TimeSpan.FromSeconds(10);

    public static async Task<Results<NoContent, NotFound<ProblemDetails>, BadRequest<ProblemDetails>, Conflict<ProblemDetails>>> HandleAsync(
        AssignUserRolesRequest request,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        ICacheService cacheService,
        ILockService lockService,
        CancellationToken cancellationToken)
    {
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User role assignment requires a current workspace.");
        }

        var lockAcquired = await lockService.TryAcquireLockAsync(LockKeys.UserRoles(request.Id), LockTimeout, cancellationToken);
        if (!lockAcquired)
        {
            return AppHttpResults.Conflict("User roles update in progress.", "Another role update operation is currently in progress for this user. Please try again.");
        }

        try
        {
            var targetUserExists = await dbContext.Users
                .AsNoTracking()
                .AnyAsync(candidate => candidate.Id == request.Id && candidate.WorkspaceId == workspaceId.Value, cancellationToken);
            if (!targetUserExists)
            {
                return AppHttpResults.NotFound("User not found.", "No user in the current workspace matched the provided identifier.");
            }

            var selectedRoleIds = (request.RoleIds ?? [])
                .Distinct()
                .ToHashSet();
            var assignableRoleIds = await dbContext.Roles
                .AsNoTracking()
                .Where(role => role.IsActive && role.NormalizedName != Constants.NormalizedSuperAdministrator)
                .Where(role => role.WorkspaceRoles.Any(workspaceRole =>
                    workspaceRole.IsActive
                    && workspaceRole.WorkspaceId == workspaceId.Value))
                .Select(role => role.Id)
                .ToListAsync(cancellationToken);
            var assignableRoleIdSet = assignableRoleIds.ToHashSet();
            if (!selectedRoleIds.All(assignableRoleIdSet.Contains))
            {
                return AppHttpResults.BadRequest("Invalid roles.", "One or more selected roles are inactive or outside the current workspace.");
            }

            var currentUserId = ClaimHelper.GetCurrentUserId(user);
            var existingAssignments = await dbContext.UserRoles
                .Include(userRole => userRole.Role)
                .Where(userRole => userRole.UserId == request.Id
                    && userRole.Role != null
                    && userRole.Role.WorkspaceRoles.Any(workspaceRole => workspaceRole.WorkspaceId == workspaceId.Value))
                .ToListAsync(cancellationToken);

            foreach (var assignment in existingAssignments)
            {
                var nextIsActive = selectedRoleIds.Contains(assignment.RoleId);
                if (assignment.IsActive == nextIsActive)
                {
                    continue;
                }

                assignment.IsActive = nextIsActive;
                assignment.UpdatedBy = currentUserId;
            }

            var existingRoleIds = existingAssignments
                .Select(assignment => assignment.RoleId)
                .ToHashSet();
            foreach (var roleId in selectedRoleIds.Except(existingRoleIds))
            {
                dbContext.UserRoles.Add(new ApplicationUserRole
                {
                    UserId = request.Id,
                    RoleId = roleId,
                    Description = "Assigned from user role assignment drawer.",
                    IsActive = true,
                    CreatedBy = currentUserId
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            // Invalidate cached user profile so new roles take effect immediately
            await cacheService.RemoveAsync(CacheKeys.UserProfile(request.Id), cancellationToken);

            return TypedResults.NoContent();
        }
        finally
        {
            await lockService.ReleaseLockAsync(LockKeys.UserRoles(request.Id), cancellationToken);
        }
    }
}
