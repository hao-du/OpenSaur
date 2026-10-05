using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;
using OpenSaur.Brainbubby.Web.Features.Nodes.Services;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Nodes.Handlers;

public static class UpdateNodeHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        UpdateNodeRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
        INodeTreeService nodeTreeService,
        IValidator<UpdateNodeRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

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
            var canEdit = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive && p.Permission == ProjectPermissionType.CanEdit);
            if (!isCreator && !canEdit)
            {
                return Results.Forbid();
            }
        }

        var trimmedName = request.Name.Trim();
        var trimmedDescription = request.Description?.Trim();

        // Service executes atomic raw SQL update
        var updated = await nodeTreeService.UpdateNodeAsync(id, currentUser.WorkspaceId, trimmedName, trimmedDescription, currentUser.Id, cancellationToken);
        if (!updated)
        {
            return Results.NotFound(new { message = "Node not found or already inactive." });
        }

        // Fetch parent for response
        var parentId = await dbContext.NodeClosures
            .AsNoTracking()
            .Where(nc => nc.DescendantId == id && nc.Depth == 1)
            .Select(nc => (Guid?)nc.AncestorId)
            .FirstOrDefaultAsync(cancellationToken);

        var response = new NodeResponse(
            node.Id,
            node.WorkspaceId,
            node.ProjectId,
            trimmedName,
            node.Type,
            node.Content,
            trimmedDescription,
            parentId,
            node.IsActive,
            node.CreatedOn,
            DateTime.UtcNow);

        return Results.Ok(response);
    }
}
