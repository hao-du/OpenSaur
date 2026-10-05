using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.SharedFiles.Handlers;

public static class GetProjectSharedFilesHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
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

        var sharedFiles = await dbContext.ProjectSharedFiles
            .AsNoTracking()
            .Where(psf => psf.ProjectId == projectId)
            .Join(dbContext.Nodes.Where(n => n.IsActive),
                psf => psf.FileNodeId,
                n => n.Id,
                (psf, n) => new { psf, n })
            .Join(dbContext.Projects,
                combined => combined.n.ProjectId,
                p => p.Id,
                (combined, p) => new SharedFileResponse(
                    combined.n.Id,
                    combined.n.ProjectId ?? Guid.Empty,
                    p.Name,
                    combined.n.Name,
                    combined.n.Description,
                    combined.n.Content,
                    combined.n.CreatedOn,
                    combined.n.UpdatedOn,
                    combined.psf.CreatedOn,
                    combined.psf.CreatedBy))
            .OrderBy(r => r.Name)
            .ToListAsync(cancellationToken);

        return Results.Ok(sharedFiles);
    }
}
