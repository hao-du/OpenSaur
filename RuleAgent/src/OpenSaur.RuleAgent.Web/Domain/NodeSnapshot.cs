using OpenSaur.RuleAgent.Web.Domain.Common;

namespace OpenSaur.RuleAgent.Web.Domain;

public class NodeSnapshot : EntityBase
{
    public Guid NodeId { get; set; }

    public string SnapshotContent { get; set; } = string.Empty;

    public SnapshotStatus Status { get; set; } = SnapshotStatus.Working;

    public Node? Node { get; set; }

    public void Approve(Guid approvedBy)
    {
        Status = SnapshotStatus.Approved;
        UpdatedBy = approvedBy;
        UpdatedOn = DateTime.UtcNow;
    }
}
