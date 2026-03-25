namespace OpenSaur.Identity.Web.Domain.Outbox;

public sealed record UserEventPayload(
    Guid Id,
    string UserName,
    string Email,
    Guid WorkspaceId,
    bool IsActive,
    bool RequirePasswordChange,
    string UserSettings);
