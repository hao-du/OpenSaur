using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Features.Nodes.Services;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Handlers;

public static class GetProjectTreeHandler
{
    public static async Task<IResult> HandleAsync(
        Guid? projectId,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        INodeTreeService nodeTreeService,
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

        if (projectId.HasValue)
        {
            var project = await dbContext.Projects
                .AsNoTracking()
                .Include(p => p.Permissions)
                .FirstOrDefaultAsync(p => p.Id == projectId.Value && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

            if (project is null)
            {
                return Results.NotFound(new { message = "Project not found." });
            }

            var isCreator = project.CreatorId == currentUser.Id;
            var hasPermission = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive);

            if (!isCreator && !hasPermission)
            {
                return Results.Forbid();
            }
        }

        var tree = await nodeTreeService.BuildProjectTreeAsync(currentUser.WorkspaceId, projectId, cancellationToken);
        return Results.Ok(tree);
    }
}
