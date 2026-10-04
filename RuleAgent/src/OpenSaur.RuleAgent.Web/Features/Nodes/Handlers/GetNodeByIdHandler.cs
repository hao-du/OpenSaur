using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Handlers;

public static class GetNodeByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
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

        var node = await dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id && n.WorkspaceId == currentUser.WorkspaceId && n.IsActive, cancellationToken);

        if (node is null)
        {
            return Results.NotFound(new { message = "Node not found." });
        }

        if (node.ProjectId.HasValue)
        {
            var project = await dbContext.Projects
                .AsNoTracking()
                .Include(p => p.Permissions)
                .FirstOrDefaultAsync(p => p.Id == node.ProjectId.Value && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

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

        // Direct parent has Depth == 1
        var parentId = await dbContext.NodeClosures
            .AsNoTracking()
            .Where(nc => nc.DescendantId == id && nc.Depth == 1)
            .Select(nc => (Guid?)nc.AncestorId)
            .FirstOrDefaultAsync(cancellationToken);

        var response = new NodeResponse(
            node.Id,
            node.WorkspaceId,
            node.ProjectId,
            node.Name,
            node.Type,
            node.Content,
            node.Description,
            parentId,
            node.IsActive,
            node.CreatedOn,
            node.UpdatedOn);

        return Results.Ok(response);
    }
}
