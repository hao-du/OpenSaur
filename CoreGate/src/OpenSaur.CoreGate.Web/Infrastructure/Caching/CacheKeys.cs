namespace OpenSaur.CoreGate.Web.Infrastructure.Caching;

public static class CacheKeys
{
    public static string UserCanImpersonate(Guid userId) => $"user:{userId}:can_impersonate";

    public static string UserWorkspaceRoles(Guid userId, Guid workspaceId) => $"user:{userId}:workspace:{workspaceId}:roles";

    public static string UserWorkspacePermissions(Guid userId, Guid workspaceId) => $"user:{userId}:workspace:{workspaceId}:permissions";

    public static string UserHomeWorkspace(Guid userId) => $"user:{userId}:home_workspace";

    public static string Workspace(Guid workspaceId) => $"workspace:{workspaceId}";

    public static string ClientPermissions(string clientId) => $"client:{clientId}:permissions";

    public static class Tags
    {
        public static string User(Guid userId) => $"user:{userId}";

        public static string Workspace(Guid workspaceId) => $"workspace:{workspaceId}";

        public static string Client(string clientId) => $"client:{clientId}";
    }
}

public sealed record WorkspaceCacheModel(Guid Id, string Name, bool IsActive);

