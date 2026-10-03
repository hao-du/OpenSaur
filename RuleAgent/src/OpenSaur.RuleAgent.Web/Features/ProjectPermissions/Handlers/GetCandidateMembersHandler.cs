using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Handlers;

public static class GetCandidateMembersHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!userContext.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        var currentUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                (userContext.UserId.HasValue && u.Id == userContext.UserId.Value) ||
                (!string.IsNullOrWhiteSpace(userContext.Email) && u.Email == userContext.Email),
                cancellationToken);

        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        // Only the Creator can inspect candidate members to add
        if (project.CreatorId != currentUser.Id)
        {
            return Results.Forbid();
        }

        var activeMemberUserIds = project.Permissions
            .Where(p => p.IsActive)
            .Select(p => p.UserId)
            .ToHashSet();

        activeMemberUserIds.Add(project.CreatorId);

        var workspaceUsers = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.WorkspaceId == currentUser.WorkspaceId && u.IsActive && u.Id != project.CreatorId)
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Select(u => new WorkspaceUserCandidateResponse(
                u.Id,
                u.Email,
                u.UserName,
                u.FirstName,
                u.LastName,
                activeMemberUserIds.Contains(u.Id)))
            .ToListAsync(cancellationToken);

        return Results.Ok(workspaceUsers);
    }
}
