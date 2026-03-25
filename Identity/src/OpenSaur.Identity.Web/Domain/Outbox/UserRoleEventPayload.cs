namespace OpenSaur.Identity.Web.Domain.Outbox;

public sealed record UserRoleEventPayload(
    Guid Id,
    Guid UserId,
    Guid RoleId,
    bool IsActive);
