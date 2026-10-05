using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Projects.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Projects.Handlers;

public static class UpdateProjectHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        UpdateProjectRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
        IValidator<UpdateProjectRequest> validator,
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

        var project = await dbContext.Projects
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == id && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        var isCreator = project.CreatorId == currentUser.Id;
        var hasCanEdit = project.Permissions.Any(p => p.UserId == currentUser.Id && p.Permission == ProjectPermissionType.CanEdit && p.IsActive);

        if (!isCreator && !hasCanEdit)
        {
            return Results.Forbid();
        }

        if (request.InstructionTemplateNodeId.HasValue && request.InstructionTemplateNodeId != project.InstructionTemplateNodeId)
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

        project.Rename(request.Name, currentUser.Id);
        project.AssignInstructionTemplate(request.InstructionTemplateNodeId, currentUser.Id);
        project.Description = request.Description?.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
