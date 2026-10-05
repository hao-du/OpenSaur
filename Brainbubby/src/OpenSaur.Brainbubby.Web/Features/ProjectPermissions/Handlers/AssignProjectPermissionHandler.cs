using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Handlers;

public static class AssignProjectPermissionHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
        AssignProjectPermissionRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
        IValidator<AssignProjectPermissionRequest> validator,
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
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        // STRICT ACCESS CONTROL: Only the project Creator can assign permissions
        if (project.CreatorId != currentUser.Id)
        {
            return Results.Forbid();
        }

        // Creator cannot change their own top-admin role
        if (request.UserId == project.CreatorId)
        {
            return Results.BadRequest(new { message = "Cannot modify the project Creator's permissions." });
        }

        // Ensure target user belongs to same workspace
        var targetUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.WorkspaceId == currentUser.WorkspaceId && u.IsActive, cancellationToken);

        if (targetUser is null)
        {
            return Results.BadRequest(new { message = "Target user does not exist in the current workspace." });
        }

        var existingPermission = project.Permissions
            .FirstOrDefault(p => p.UserId == request.UserId);

        if (existingPermission is not null)
        {
            existingPermission.ChangePermission(request.Permission, currentUser.Id);
            existingPermission.IsActive = true;
        }
        else
        {
            var newPermission = new ProjectUserPermission
            {
                Id = Guid.CreateVersion7(),
                ProjectId = project.Id,
                UserId = request.UserId,
                Permission = request.Permission,
                IsActive = true,
                CreatedBy = currentUser.Id,
                CreatedOn = DateTime.UtcNow
            };

            dbContext.ProjectUserPermissions.Add(newPermission);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { message = "Permission assigned successfully." });
    }
}
