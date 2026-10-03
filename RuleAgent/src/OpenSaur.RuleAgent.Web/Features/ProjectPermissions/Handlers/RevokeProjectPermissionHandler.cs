using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Handlers;

public static class RevokeProjectPermissionHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
        Guid userId,
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
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        // STRICT ACCESS CONTROL: Only the project Creator can revoke permissions
        if (project.CreatorId != currentUser.Id)
        {
            return Results.Forbid();
        }

        if (userId == project.CreatorId)
        {
            return Results.BadRequest(new { message = "Cannot revoke the project Creator's permissions." });
        }

        var permission = project.Permissions.FirstOrDefault(p => p.UserId == userId && p.IsActive);
        if (permission is null)
        {
            return Results.NotFound(new { message = "Member permission not found." });
        }

        permission.IsActive = false;
        permission.UpdatedBy = currentUser.Id;
        permission.UpdatedOn = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
