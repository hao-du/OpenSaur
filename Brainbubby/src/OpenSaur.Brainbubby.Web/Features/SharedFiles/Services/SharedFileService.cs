using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;

namespace OpenSaur.Brainbubby.Web.Features.SharedFiles.Services;

public sealed class SharedFileService(BrainbubbyDbContext dbContext) : ISharedFileService
{
    public async Task<(ShareFileResult Result, ProjectSharedFile? SharedFile, Node? FileNode)> ShareFileAsync(
        Guid projectId,
        Guid fileNodeId,
        Guid workspaceId,
        Guid createdBy,
        CancellationToken cancellationToken = default)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == workspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return (ShareFileResult.ProjectNotFoundOrInactive, null, null);
        }

        var fileNode = await dbContext.Nodes
            .AsNoTracking()
            .Include(n => n.Project)
            .FirstOrDefaultAsync(n => n.Id == fileNodeId && n.WorkspaceId == workspaceId && n.Type == NodeType.File && n.IsActive, cancellationToken);

        if (fileNode is null)
        {
            return (ShareFileResult.FileNotFoundOrNotActive, null, null);
        }

        if (fileNode.ProjectId == projectId)
        {
            return (ShareFileResult.AlreadyInSameProject, null, null);
        }

        var sharedFile = new ProjectSharedFile
        {
            ProjectId = projectId,
            FileNodeId = fileNodeId,
            CreatedBy = createdBy,
            CreatedOn = DateTime.UtcNow
        };

        try
        {
            dbContext.ProjectSharedFiles.Add(sharedFile);
            await dbContext.SaveChangesAsync(cancellationToken);
            return (ShareFileResult.Success, sharedFile, fileNode);
        }
        catch (DbUpdateException)
        {
            // Primary key (ProjectId, FileNodeId) collision handled cleanly across all DB providers
            return (ShareFileResult.AlreadyShared, null, null);
        }
    }

    public async Task<bool> UnshareFileAsync(
        Guid projectId,
        Guid fileNodeId,
        CancellationToken cancellationToken = default)
    {
        var rowsAffected = await dbContext.ProjectSharedFiles
            .Where(psf => psf.ProjectId == projectId && psf.FileNodeId == fileNodeId)
            .ExecuteDeleteAsync(cancellationToken);

        return rowsAffected > 0;
    }
}
