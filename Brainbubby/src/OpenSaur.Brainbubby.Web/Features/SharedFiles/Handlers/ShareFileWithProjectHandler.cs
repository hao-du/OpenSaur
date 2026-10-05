using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Dtos;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Services;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.SharedFiles.Handlers;

public static class ShareFileWithProjectHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
        ShareFileRequest request,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
        ISharedFileService sharedFileService,
        IValidator<ShareFileRequest> validator,
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

        // Verify user has CanEdit or Creator permission on target project
        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Target project not found." });
        }

        var isCreator = project.CreatorId == currentUser.Id;
        var canEdit = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive && p.Permission == ProjectPermissionType.CanEdit);
        if (!isCreator && !canEdit)
        {
            return Results.Forbid();
        }

        // Service handles atomic transaction, FOR UPDATE locks on both project and file
        var (result, sharedFile, fileNode) = await sharedFileService.ShareFileAsync(
            projectId,
            request.FileNodeId,
            currentUser.WorkspaceId,
            currentUser.Id,
            cancellationToken);

        return result switch
        {
            ShareFileResult.ProjectNotFoundOrInactive => Results.NotFound(new { message = "Target project not found or inactive." }),
            ShareFileResult.FileNotFoundOrNotActive => Results.NotFound(new { message = "Source file not found or inactive." }),
            ShareFileResult.AlreadyInSameProject => Results.BadRequest(new { message = "File already belongs natively to this project." }),
            ShareFileResult.AlreadyShared => Results.Conflict(new { message = "File is already shared with this project." }),
            ShareFileResult.Success when sharedFile is not null && fileNode is not null => Results.Created(
                $"/api/projects/{projectId}/shared-files/{fileNode.Id}",
                new SharedFileResponse(
                    fileNode.Id,
                    fileNode.ProjectId ?? Guid.Empty,
                    fileNode.Project?.Name ?? string.Empty,
                    fileNode.Name,
                    fileNode.Description,
                    fileNode.Content,
                    fileNode.CreatedOn,
                    fileNode.UpdatedOn,
                    sharedFile.CreatedOn,
                    sharedFile.CreatedBy)),
            _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
        };
    }
}
