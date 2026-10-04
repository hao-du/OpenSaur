using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Dtos;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Services;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Snapshots.Handlers;

public static class UpdateNodeContentHandler
{
    public static async Task<IResult> HandleAsync(
        Guid nodeId,
        UpdateNodeContentRequest request,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        ISnapshotService snapshotService,
        IValidator<UpdateNodeContentRequest> validator,
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
            .FirstOrDefaultAsync(n => n.Id == nodeId && n.WorkspaceId == currentUser.WorkspaceId && n.IsActive, cancellationToken);

        if (node is null)
        {
            return Results.NotFound(new { message = "Node not found." });
        }

        if (node.Type == NodeType.Folder)
        {
            return Results.BadRequest(new { message = "Folders do not have content." });
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

        var updatedOn = await snapshotService.UpdateContentAsync(nodeId, currentUser.WorkspaceId, request.Content, currentUser.Id, cancellationToken);
        if (!updatedOn.HasValue)
        {
            return Results.NotFound(new { message = "Node not found, inactive, or is a folder." });
        }

        return Results.Ok(new { message = "Content updated successfully.", updatedOn = updatedOn.Value });
    }
}
