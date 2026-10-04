using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.SharedFiles.Services;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.SharedFiles.Handlers;

public static class UnshareFileFromProjectHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
        Guid fileNodeId,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        ISharedFileService sharedFileService,
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

        // Verify project access: user must be Creator or have CanEdit
        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        var isCreator = project.CreatorId == currentUser.Id;
        var canEdit = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive && p.Permission == ProjectPermissionType.CanEdit);
        if (!isCreator && !canEdit)
        {
            return Results.Forbid();
        }

        // Service executes atomic raw SQL DELETE
        var unshared = await sharedFileService.UnshareFileAsync(projectId, fileNodeId, cancellationToken);
        if (!unshared)
        {
            return Results.NotFound(new { message = "Shared file association not found for this project." });
        }

        return Results.NoContent();
    }
}
