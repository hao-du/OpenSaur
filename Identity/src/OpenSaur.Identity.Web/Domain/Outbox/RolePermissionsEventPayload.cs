namespace OpenSaur.Identity.Web.Domain.Outbox;

public sealed record RolePermissionsEventPayload(
    Guid RoleId,
    string RoleName,
    bool RoleIsActive,
    int[] PermissionCodeIds);
