using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Dtos;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Services;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Snapshots.Handlers;

public static class CreateSnapshotHandler
{
    public static async Task<IResult> HandleAsync(
        Guid nodeId,
        CreateSnapshotRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
        ISnapshotService snapshotService,
        IValidator<CreateSnapshotRequest> validator,
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
            return Results.BadRequest(new { message = "Cannot create snapshots for folders." });
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

        var snapshot = await snapshotService.CreateSnapshotAsync(nodeId, currentUser.WorkspaceId, request.Description, currentUser.Id, cancellationToken);
        if (snapshot is null)
        {
            return Results.BadRequest(new { message = "Cannot create snapshot for folder or inactive node." });
        }

        var response = new SnapshotResponse(
            snapshot.Id,
            snapshot.NodeId,
            snapshot.SnapshotContent,
            snapshot.Status,
            snapshot.Description,
            snapshot.IsActive,
            snapshot.CreatedBy,
            snapshot.CreatedOn,
            snapshot.UpdatedBy,
            snapshot.UpdatedOn);

        return Results.Created($"/api/snapshots/{snapshot.Id}", response);
    }
}
