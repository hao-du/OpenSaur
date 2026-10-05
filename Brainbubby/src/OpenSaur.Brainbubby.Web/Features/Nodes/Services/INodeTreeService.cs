using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;

namespace OpenSaur.Brainbubby.Web.Features.Nodes.Services;

public interface INodeTreeService
{
    Task<bool> CreateNodeAsync(Node node, Guid? parentId, CancellationToken cancellationToken = default);
    Task<bool> UpdateNodeAsync(Guid nodeId, Guid workspaceId, string name, string? description, Guid updatedBy, CancellationToken cancellationToken = default);
    Task<DateTime?> MoveSubtreeAsync(Guid nodeId, Guid? newParentId, Guid updatedBy, CancellationToken cancellationToken = default);
    Task SoftDeleteSubtreeAsync(Guid nodeId, Guid updatedBy, CancellationToken cancellationToken = default);
    Task<List<NodeBreadcrumbResponse>> GetBreadcrumbAsync(Guid nodeId, CancellationToken cancellationToken = default);
    Task<List<NodeTreeNodeResponse>> BuildProjectTreeAsync(Guid workspaceId, Guid? projectId, CancellationToken cancellationToken = default);
}
