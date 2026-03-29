namespace OpenSaur.Identity.Web.Domain.Outbox;

public static class OutboxEventNames
{
    public const string UserCreated = "UserCreated";
    public const string UserUpdated = "UserUpdated";
    public const string WorkspaceCreated = "WorkspaceCreated";
    public const string WorkspaceUpdated = "WorkspaceUpdated";
    public const string UserRoleCreated = "UserRoleCreated";
    public const string UserRoleUpdated = "UserRoleUpdated";
    public const string RolePermissionsCreated = "RolePermissionsCreated";
    public const string RolePermissionsUpdated = "RolePermissionsUpdated";
}
