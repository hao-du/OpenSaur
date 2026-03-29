namespace OpenSaur.Identity.Web.Domain.Outbox;

public sealed record WorkspaceEventPayload(
    Guid WorkspaceId,
    string Name,
    string Description,
    bool IsActive,
    Guid[] AssignedRoleIds);
