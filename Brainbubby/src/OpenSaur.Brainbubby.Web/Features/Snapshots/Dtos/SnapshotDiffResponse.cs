using OpenSaur.Brainbubby.Web.Domain;

namespace OpenSaur.Brainbubby.Web.Features.Snapshots.Dtos;

public sealed record SnapshotDiffResponse(
    Guid SnapshotId,
    Guid NodeId,
    string SnapshotContent,
    string CurrentContent,
    SnapshotStatus Status,
    DateTime CreatedOn);
