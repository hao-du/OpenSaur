using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;
using OpenSaur.Brainbubby.Web.Features.Nodes.Services;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Nodes.Handlers;

public static class MoveNodeHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        MoveNodeRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
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

        var node = await dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id && n.WorkspaceId == currentUser.WorkspaceId && n.IsActive, cancellationToken);

        if (node is null)
        {
            return Results.NotFound(new { message = "Node not found." });
        }

        // Permission check on source project
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
            var canEdit = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive && p.Permission == ProjectPermissionType.CanEdit);
            if (!isCreator && !canEdit)
            {
                return Results.Forbid();
            }
        }

        // Delegate move, cycle detection, folder validation, row-locking, and UpdatedOn update to service
        var updatedOn = await nodeTreeService.MoveSubtreeAsync(id, request.NewParentId, currentUser.Id, cancellationToken);
        if (!updatedOn.HasValue)
        {
            return Results.BadRequest(new { message = "Cannot move node to the specified destination (cycle, invalid parent folder, or inactive node detected)." });
        }

        var response = new NodeResponse(
            node.Id,
            node.WorkspaceId,
            node.ProjectId,
            node.Name,
            node.Type,
            node.Content,
            node.Description,
            request.NewParentId,
            node.IsActive,
            node.CreatedOn,
            updatedOn.Value);

        return Results.Ok(response);
    }
}
