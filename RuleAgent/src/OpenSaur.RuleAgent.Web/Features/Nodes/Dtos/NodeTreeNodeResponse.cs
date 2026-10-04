using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;

public sealed record NodeTreeNodeResponse
{
    public Guid Id { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid? ProjectId { get; init; }
    public string Name { get; init; } = string.Empty;
    public NodeType Type { get; init; }
    public string? Description { get; init; }
    public Guid? ParentId { get; init; }
    public int Depth { get; set; }
    public DateTime CreatedOn { get; init; }
    public DateTime? UpdatedOn { get; init; }
    public List<NodeTreeNodeResponse> Children { get; init; } = [];

    public NodeTreeNodeResponse() { }

    public NodeTreeNodeResponse(
        Guid id,
        Guid workspaceId,
        Guid? projectId,
        string name,
        NodeType type,
        string? description,
        Guid? parentId,
        int depth,
        DateTime createdOn,
        DateTime? updatedOn,
        List<NodeTreeNodeResponse> children)
    {
        Id = id;
        WorkspaceId = workspaceId;
        ProjectId = projectId;
        Name = name;
        Type = type;
        Description = description;
        ParentId = parentId;
        Depth = depth;
        CreatedOn = createdOn;
        UpdatedOn = updatedOn;
        Children = children;
    }
}
