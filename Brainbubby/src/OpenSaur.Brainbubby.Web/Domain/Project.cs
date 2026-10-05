using OpenSaur.Brainbubby.Web.Domain.Common;

namespace OpenSaur.Brainbubby.Web.Domain;

public class Project : EntityBase, IAggregateRoot
{
    public Guid WorkspaceId { get; set; }

    public string Name { get; set; } = string.Empty;

    public Guid CreatorId { get; set; }

    public Guid? InstructionTemplateNodeId { get; set; }

    public Workspace? Workspace { get; set; }

    public User? Creator { get; set; }

    public Node? InstructionTemplateNode { get; set; }

    public ICollection<ProjectUserPermission> Permissions { get; set; } = [];

    public ICollection<Node> Nodes { get; set; } = [];

    public ICollection<ProjectSharedFile> SharedFiles { get; set; } = [];

    public void Rename(string newName, Guid updatedBy)
    {
        Name = newName.Trim();
        UpdatedBy = updatedBy;
        UpdatedOn = DateTime.UtcNow;
    }

    public void AssignInstructionTemplate(Guid? templateNodeId, Guid updatedBy)
    {
        InstructionTemplateNodeId = templateNodeId;
        UpdatedBy = updatedBy;
        UpdatedOn = DateTime.UtcNow;
    }
}
