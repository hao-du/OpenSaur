using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Features.Projects.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Projects.Handlers;

public static class GetProjectByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
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

        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Creator)
            .Include(p => p.InstructionTemplateNode)
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == id && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        var isCreator = project.CreatorId == currentUser.Id;
        var userPermission = project.Permissions.FirstOrDefault(p => p.UserId == currentUser.Id && p.IsActive);

        if (!isCreator && userPermission is null)
        {
            return Results.Forbid();
        }

        var currentRole = isCreator
            ? "Creator"
            : userPermission!.Permission.ToString();

        var response = new ProjectResponse(
            project.Id,
            project.WorkspaceId,
            project.Name,
            project.Description,
            project.CreatorId,
            project.Creator != null ? $"{project.Creator.FirstName} {project.Creator.LastName}".Trim() : "Unknown",
            project.InstructionTemplateNodeId,
            project.InstructionTemplateNode?.Name,
            project.IsActive,
            project.CreatedOn,
            project.UpdatedOn,
            currentRole);

        return Results.Ok(response);
    }
}
