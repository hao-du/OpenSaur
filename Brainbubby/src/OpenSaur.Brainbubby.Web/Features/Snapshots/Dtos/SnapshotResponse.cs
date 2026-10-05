using OpenSaur.Brainbubby.Web.Domain;

namespace OpenSaur.Brainbubby.Web.Features.Snapshots.Dtos;

public sealed record SnapshotResponse(
    Guid Id,
    Guid NodeId,
    string SnapshotContent,
    SnapshotStatus Status,
    string? Description,
    bool IsActive,
    Guid CreatedBy,
    DateTime CreatedOn,
    Guid? UpdatedBy,
    DateTime? UpdatedOn);
