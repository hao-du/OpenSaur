using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;
using OpenSaur.RuleAgent.Web.Features.Nodes.Services;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Handlers;

public static class CreateNodeHandler
{
    public static async Task<IResult> HandleAsync(
        Guid? projectId,
        CreateNodeRequest request,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        INodeTreeService nodeTreeService,
        IValidator<CreateNodeRequest> validator,
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

        // Permission check on project scope if node is inside a project
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
            var canEdit = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive && p.Permission == ProjectPermissionType.CanEdit);

            if (!isCreator && !canEdit)
            {
                return Results.Forbid();
            }
        }

        var node = new Node
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = currentUser.WorkspaceId,
            ProjectId = projectId,
            Name = request.Name.Trim(),
            Type = request.Type,
            Description = request.Description?.Trim(),
            Content = request.Content ?? string.Empty,
            IsActive = true,
            CreatedBy = currentUser.Id,
            CreatedOn = DateTime.UtcNow
        };

        // Service handles atomic transaction, parent folder lock (FOR UPDATE), and closure tree creation
        var success = await nodeTreeService.CreateNodeAsync(node, request.ParentId, cancellationToken);
        if (!success)
        {
            return Results.BadRequest(new { message = "Parent folder not found or is inactive." });
        }

        var response = new NodeResponse(
            node.Id,
            node.WorkspaceId,
            node.ProjectId,
            node.Name,
            node.Type,
            node.Content,
            node.Description,
            request.ParentId,
            node.IsActive,
            node.CreatedOn,
            node.UpdatedOn);

        return Results.Created($"/api/nodes/{node.Id}", response);
    }
}
