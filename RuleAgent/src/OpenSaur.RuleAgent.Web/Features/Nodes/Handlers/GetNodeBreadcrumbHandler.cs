using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Features.Nodes.Services;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Handlers;

public static class GetNodeBreadcrumbHandler
{
    public static async Task<IResult> HandleAsync(
        Guid nodeId,
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

        var targetNode = await dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == nodeId && n.WorkspaceId == currentUser.WorkspaceId && n.IsActive, cancellationToken);

        if (targetNode is null)
        {
            return Results.NotFound(new { message = "Node not found." });
        }

        if (targetNode.ProjectId.HasValue)
        {
            var project = await dbContext.Projects
                .AsNoTracking()
                .Include(p => p.Permissions)
                .FirstOrDefaultAsync(p => p.Id == targetNode.ProjectId.Value && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

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

        var breadcrumbs = await nodeTreeService.GetBreadcrumbAsync(nodeId, cancellationToken);
        return Results.Ok(breadcrumbs);
    }
}
