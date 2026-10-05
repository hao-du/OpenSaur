using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Projects.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Projects.Handlers;

public static class CreateProjectHandler
{
    public static async Task<IResult> HandleAsync(
        CreateProjectRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
        IValidator<CreateProjectRequest> validator,
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
            .FirstOrDefaultAsync(u =>
                (userContext.UserId.HasValue && u.Id == userContext.UserId.Value) ||
                (!string.IsNullOrWhiteSpace(userContext.Email) && u.Email == userContext.Email),
                cancellationToken);

        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        if (request.InstructionTemplateNodeId.HasValue)
        {
            var templateExists = await dbContext.Nodes
                .AnyAsync(n => n.Id == request.InstructionTemplateNodeId.Value &&
                               n.Type == NodeType.Template &&
                               n.IsActive, cancellationToken);

            if (!templateExists)
            {
                return Results.BadRequest(new { message = "Selected instruction template does not exist." });
            }
        }

        var project = new Project
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = currentUser.WorkspaceId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatorId = currentUser.Id,
            InstructionTemplateNodeId = request.InstructionTemplateNodeId,
            IsActive = true,
            CreatedBy = currentUser.Id,
            CreatedOn = DateTime.UtcNow
        };

        var creatorPermission = new ProjectUserPermission
        {
            Id = Guid.CreateVersion7(),
            ProjectId = project.Id,
            UserId = currentUser.Id,
            Permission = ProjectPermissionType.CanEdit,
            IsActive = true,
            CreatedBy = currentUser.Id,
            CreatedOn = DateTime.UtcNow
        };

        dbContext.Projects.Add(project);
        dbContext.ProjectUserPermissions.Add(creatorPermission);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new ProjectResponse(
            project.Id,
            project.WorkspaceId,
            project.Name,
            project.Description,
            project.CreatorId,
            $"{currentUser.FirstName} {currentUser.LastName}".Trim(),
            project.InstructionTemplateNodeId,
            null,
            project.IsActive,
            project.CreatedOn,
            project.UpdatedOn,
            "Creator");

        return Results.Created($"/api/projects/{project.Id}", response);
    }
}
