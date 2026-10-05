using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Nodes.Services;
using OpenSaur.Brainbubby.Web.Features.Templates.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Auth;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Templates.Handlers;

public static class CreateTemplateHandler
{
    public static async Task<IResult> HandleAsync(
        CreateTemplateRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
        INodeTreeService nodeTreeService,
        IValidator<CreateTemplateRequest> validator,
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

        // Must have SuperAdministrator role to create workspace-level instruction templates
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

        var node = new Node
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = currentUser.WorkspaceId,
            ProjectId = null, // Global to workspace
            Name = request.Name.Trim(),
            Type = NodeType.Template,
            Description = request.Description?.Trim(),
            Content = request.Content ?? string.Empty,
            IsActive = true,
            CreatedBy = currentUser.Id,
            CreatedOn = DateTime.UtcNow
        };

        var success = await nodeTreeService.CreateNodeAsync(node, parentId: null, cancellationToken);
        if (!success)
        {
            return Results.BadRequest(new { message = "Failed to create instruction template." });
        }

        var response = new TemplateResponse(
            node.Id,
            node.WorkspaceId,
            node.Name,
            node.Description,
            node.Content,
            node.IsActive,
            node.CreatedOn,
            node.UpdatedOn);

        return Results.Created($"/api/templates/{node.Id}", response);
    }
}
