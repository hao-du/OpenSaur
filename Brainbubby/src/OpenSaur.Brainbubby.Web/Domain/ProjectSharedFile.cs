namespace OpenSaur.Brainbubby.Web.Domain;

public class ProjectSharedFile
{
    public Guid ProjectId { get; set; }

    public Guid FileNodeId { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime CreatedOn { get; set; }

    public Project? Project { get; set; }

    public Node? FileNode { get; set; }
}
