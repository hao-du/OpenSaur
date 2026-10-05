namespace OpenSaur.Brainbubby.Web.Domain;

public class NodeClosure
{
    public Guid AncestorId { get; set; }

    public Guid DescendantId { get; set; }

    public int Depth { get; set; }

    public Node? Ancestor { get; set; }

    public Node? Descendant { get; set; }
}
