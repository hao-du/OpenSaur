using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.SharedFiles.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.SharedFiles.Handlers;

public static class GetSharedFileContentHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
        Guid fileNodeId,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
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

        // 1. Verify user has at least CanView or Creator on consuming project
        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        var isCreator = project.CreatorId == currentUser.Id;
        var hasPermission = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive);
        if (!isCreator && !hasPermission)
        {
            return Results.Forbid();
        }

        // 2. Verify file is shared with this project
        var sharedFileRecord = await dbContext.ProjectSharedFiles
            .AsNoTracking()
            .FirstOrDefaultAsync(psf => psf.ProjectId == projectId && psf.FileNodeId == fileNodeId, cancellationToken);

        if (sharedFileRecord is null)
        {
            return Results.NotFound(new { message = "Shared file not found in this project." });
        }

        // 3. Fetch source file node details
        var fileNode = await dbContext.Nodes
            .AsNoTracking()
            .Include(n => n.Project)
            .FirstOrDefaultAsync(n => n.Id == fileNodeId && n.IsActive, cancellationToken);

        if (fileNode is null)
        {
            return Results.NotFound(new { message = "Source file is inactive or deleted." });
        }

        var response = new SharedFileResponse(
            fileNode.Id,
            fileNode.ProjectId ?? Guid.Empty,
            fileNode.Project?.Name ?? string.Empty,
            fileNode.Name,
            fileNode.Description,
            fileNode.Content,
            fileNode.CreatedOn,
            fileNode.UpdatedOn,
            sharedFileRecord.CreatedOn,
            sharedFileRecord.CreatedBy);

        return Results.Ok(response);
    }
}
