using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Nodes.Handlers;

public static class GetNodeChildrenHandler
{
    public static async Task<IResult> HandleAsync(
        Guid parentId,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
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

        var parentNode = await dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == parentId && n.WorkspaceId == currentUser.WorkspaceId && n.IsActive, cancellationToken);

        if (parentNode is null)
        {
            return Results.NotFound(new { message = "Parent node not found." });
        }

        if (parentNode.ProjectId.HasValue)
        {
            var project = await dbContext.Projects
                .AsNoTracking()
                .Include(p => p.Permissions)
                .FirstOrDefaultAsync(p => p.Id == parentNode.ProjectId.Value && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

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

        // Direct children are descendants with Depth == 1
        var children = await dbContext.NodeClosures
            .AsNoTracking()
            .Where(nc => nc.AncestorId == parentId && nc.Depth == 1)
            .Join(dbContext.Nodes.Where(n => n.IsActive),
                closure => closure.DescendantId,
                node => node.Id,
                (closure, node) => node)
            .ToListAsync(cancellationToken);

        var sortedResponses = children
            .OrderBy(n => n.Type == NodeType.Folder ? 0 : 1)
            .ThenBy(n => n.Name, StringComparer.OrdinalIgnoreCase)
            .Select(n => new NodeResponse(
                n.Id,
                n.WorkspaceId,
                n.ProjectId,
                n.Name,
                n.Type,
                n.Content,
                n.Description,
                parentId,
                n.IsActive,
                n.CreatedOn,
                n.UpdatedOn))
            .ToList();

        return Results.Ok(sortedResponses);
    }
}
