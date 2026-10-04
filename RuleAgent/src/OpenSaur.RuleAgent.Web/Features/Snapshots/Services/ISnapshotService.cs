using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.Snapshots.Services;

public interface ISnapshotService
{
    Task<DateTime?> UpdateContentAsync(Guid nodeId, Guid workspaceId, string content, Guid updatedBy, CancellationToken cancellationToken = default);
    Task<NodeSnapshot?> CreateSnapshotAsync(Guid nodeId, Guid workspaceId, string? description, Guid createdBy, CancellationToken cancellationToken = default);
    Task<NodeSnapshot?> ApproveSnapshotAsync(Guid snapshotId, Guid workspaceId, Guid approvedBy, CancellationToken cancellationToken = default);
}
