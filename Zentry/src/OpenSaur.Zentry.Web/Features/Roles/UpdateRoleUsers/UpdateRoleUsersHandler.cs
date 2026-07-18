using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Identity;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Roles.UpdateRoleUsers;

public static class UpdateRoleUsersHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        UpdateRoleUsersRequest request,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User assignment requires a current workspace.");
        }

        var roleExists = await dbContext.Roles
            .AsNoTracking()
            .Where(candidate => candidate.Id == request.RoleId
                && candidate.IsActive
                && candidate.NormalizedName != Constants.NormalizedSuperAdministrator)
            .AnyAsync(candidate => candidate.WorkspaceRoles.Any(workspaceRole =>
                workspaceRole.IsActive
                && workspaceRole.WorkspaceId == workspaceId.Value), cancellationToken);
        if (!roleExists)
        {
            return AppHttpResults.NotFound("Role not found.", "No assignable role matched the provided identifier.");
        }

        var selectedUserIds = (request.UserIds ?? [])
            .Distinct()
            .ToHashSet();
        var activeWorkspaceUserIds = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.WorkspaceId == workspaceId.Value && candidate.IsActive)
            .Select(candidate => candidate.Id)
            .ToListAsync(cancellationToken);
        var activeWorkspaceUserIdSet = activeWorkspaceUserIds.ToHashSet();
        if (!selectedUserIds.All(activeWorkspaceUserIdSet.Contains))
        {
            return AppHttpResults.BadRequest("Invalid users.", "One or more selected users are inactive or outside the current workspace.");
        }

        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var existingAssignments = await dbContext.UserRoles
            .Include(userRole => userRole.User)
            .Where(userRole => userRole.RoleId == request.RoleId
                && userRole.User != null
                && userRole.User.WorkspaceId == workspaceId.Value)
            .ToListAsync(cancellationToken);

        foreach (var assignment in existingAssignments)
        {
            var nextIsActive = selectedUserIds.Contains(assignment.UserId);
            if (assignment.IsActive == nextIsActive)
            {
                continue;
            }

            assignment.IsActive = nextIsActive;
            assignment.UpdatedBy = currentUserId;
        }

        var existingUserIds = existingAssignments
            .Select(assignment => assignment.UserId)
            .ToHashSet();
        foreach (var userId in selectedUserIds.Except(existingUserIds))
        {
            dbContext.UserRoles.Add(new ApplicationUserRole
            {
                UserId = userId,
                RoleId = request.RoleId,
                Description = "Assigned from role user assignment drawer.",
                IsActive = true,
                CreatedBy = currentUserId
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
