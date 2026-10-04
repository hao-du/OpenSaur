using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;

namespace OpenSaur.RuleAgent.Web.Features.Snapshots.Services;

public sealed class SnapshotService(RuleAgentDbContext dbContext) : ISnapshotService
{
    public async Task<DateTime?> UpdateContentAsync(
        Guid nodeId,
        Guid workspaceId,
        string content,
        Guid updatedBy,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var rowsAffected = await dbContext.Nodes
            .Where(n => n.Id == nodeId && n.WorkspaceId == workspaceId && n.Type != NodeType.Folder && n.IsActive)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.Content, content)
                .SetProperty(n => n.UpdatedBy, updatedBy)
                .SetProperty(n => n.UpdatedOn, now), cancellationToken);

        return rowsAffected > 0 ? now : null;
    }

    public async Task<NodeSnapshot?> CreateSnapshotAsync(
        Guid nodeId,
        Guid workspaceId,
        string? description,
        Guid createdBy,
        CancellationToken cancellationToken = default)
    {
        var node = await dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == nodeId && n.WorkspaceId == workspaceId && n.Type != NodeType.Folder && n.IsActive, cancellationToken);

        if (node is null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var snapshot = new NodeSnapshot
        {
            Id = Guid.CreateVersion7(),
            NodeId = node.Id,
            SnapshotContent = node.Content,
            Status = SnapshotStatus.Working,
            Description = description?.Trim(),
            IsActive = true,
            CreatedBy = createdBy,
            CreatedOn = now
        };

        dbContext.NodeSnapshots.Add(snapshot);
        await dbContext.SaveChangesAsync(cancellationToken);

        return snapshot;
    }

    public async Task<NodeSnapshot?> ApproveSnapshotAsync(
        Guid snapshotId,
        Guid workspaceId,
        Guid approvedBy,
        CancellationToken cancellationToken = default)
    {
        var snapshot = await dbContext.NodeSnapshots
            .Include(s => s.Node)
            .FirstOrDefaultAsync(s => s.Id == snapshotId && s.IsActive, cancellationToken);

        if (snapshot is null || snapshot.Node is null || !snapshot.Node.IsActive || snapshot.Node.WorkspaceId != workspaceId)
        {
            return null;
        }

        // Domain method encapsulates state transition
        snapshot.Approve(approvedBy);
        await dbContext.SaveChangesAsync(cancellationToken);

        return snapshot;
    }
}
