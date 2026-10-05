using OpenSaur.Brainbubby.Web.Domain.Common;

namespace OpenSaur.Brainbubby.Web.Domain;

public class Node : EntityBase, IAggregateRoot
{
    public Guid WorkspaceId { get; set; }

    public Guid? ProjectId { get; set; }

    public string Name { get; set; } = string.Empty;

    public NodeType Type { get; set; } = NodeType.File;

    public string Content { get; set; } = string.Empty;

    public Workspace? Workspace { get; set; }

    public Project? Project { get; set; }

    public ICollection<NodeSnapshot> Snapshots { get; set; } = [];

    public ICollection<NodeClosure> AncestorPaths { get; set; } = [];

    public ICollection<NodeClosure> DescendantPaths { get; set; } = [];

    public ICollection<ProjectSharedFile> SharedInProjects { get; set; } = [];

    public void UpdateContent(string newContent, Guid updatedBy)
    {
        Content = newContent;
        UpdatedBy = updatedBy;
        UpdatedOn = DateTime.UtcNow;
    }

    public void Rename(string newName, Guid updatedBy)
    {
        Name = newName.Trim();
        UpdatedBy = updatedBy;
        UpdatedOn = DateTime.UtcNow;
    }

    public NodeSnapshot CreateSnapshot(Guid createdBy, string? description = null)
    {
        var snapshot = new NodeSnapshot
        {
            Id = Guid.NewGuid(),
            NodeId = Id,
            SnapshotContent = Content,
            Status = SnapshotStatus.Working,
            Description = description,
            IsActive = true,
            CreatedBy = createdBy,
            CreatedOn = DateTime.UtcNow
        };

        Snapshots.Add(snapshot);
        return snapshot;
    }
}
