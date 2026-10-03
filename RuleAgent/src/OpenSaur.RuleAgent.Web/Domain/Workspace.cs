using OpenSaur.RuleAgent.Web.Domain.Common;

namespace OpenSaur.RuleAgent.Web.Domain;

public class Workspace : EntityBase, IAggregateRoot
{
    public string Name { get; set; } = string.Empty;

    public ICollection<User> Users { get; set; } = [];

    public ICollection<Project> Projects { get; set; } = [];

    public ICollection<Node> Nodes { get; set; } = [];
}
