using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.Snapshots.Dtos;

public sealed record SnapshotDiffResponse(
    Guid SnapshotId,
    Guid NodeId,
    string SnapshotContent,
    string CurrentContent,
    SnapshotStatus Status,
    DateTime CreatedOn);
