namespace OpenSaur.Zentry.Web.Infrastructure.Lock;

public static class LockKeys
{
    public const string TokenRefreshPrefix = "lock:bff:refresh:";
    public const string WorkspaceUsersPrefix = "lock:workspace:users:";
    public const string UserRolesPrefix = "lock:user:roles:";
    public const string RoleUsersPrefix = "lock:role:users:";
    public const string WorkspaceCreatePrefix = "lock:workspace:create:";

    public static string TokenRefresh(string userId) => $"{TokenRefreshPrefix}{userId}";
    public static string WorkspaceUsers(Guid workspaceId) => $"{WorkspaceUsersPrefix}{workspaceId}";
    public static string UserRoles(Guid userId) => $"{UserRolesPrefix}{userId}";
    public static string RoleUsers(Guid roleId) => $"{RoleUsersPrefix}{roleId}";
    public static string WorkspaceCreate(string normalizedName) => $"{WorkspaceCreatePrefix}{normalizedName}";
}

