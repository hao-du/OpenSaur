using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.Nodes.Services;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Services;
using OpenSaur.RuleAgent.Web.Features.Templates.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Auth;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Templates.Handlers;

public static class UpdateTemplateHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        UpdateTemplateRequest request,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        INodeTreeService nodeTreeService,
        ISnapshotService snapshotService,
        IValidator<UpdateTemplateRequest> validator,
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

        // Must have SuperAdministrator role to update instruction templates
        if (!userContext.IsSuperAdministrator)
        {
            return Results.Forbid();
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

        var template = await dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id &&
                                      n.WorkspaceId == currentUser.WorkspaceId &&
                                      n.ProjectId == null &&
                                      n.Type == NodeType.Template &&
                                      n.IsActive, cancellationToken);

        if (template is null)
        {
            return Results.NotFound(new { message = "Instruction template not found." });
        }

        var trimmedName = request.Name.Trim();
        var trimmedDescription = request.Description?.Trim();

        // 1. Update Name and Description atomically
        var nameUpdated = await nodeTreeService.UpdateNodeAsync(id, currentUser.WorkspaceId, trimmedName, trimmedDescription, currentUser.Id, cancellationToken);
        if (!nameUpdated)
        {
            return Results.NotFound(new { message = "Template not found or already inactive." });
        }

        // 2. Update Content if provided
        DateTime? contentUpdatedOn = null;
        if (request.Content is not null)
        {
            contentUpdatedOn = await snapshotService.UpdateContentAsync(id, currentUser.WorkspaceId, request.Content, currentUser.Id, cancellationToken);
        }

        var response = new TemplateResponse(
            template.Id,
            template.WorkspaceId,
            trimmedName,
            trimmedDescription,
            request.Content ?? template.Content,
            template.IsActive,
            template.CreatedOn,
            contentUpdatedOn ?? DateTime.UtcNow);

        return Results.Ok(response);
    }
}
