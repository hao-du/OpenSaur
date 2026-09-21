namespace OpenSaur.Zentry.Web.Infrastructure.Cache;

public static class CacheKeys
{
    public const string TokenSessionPrefix = "bff:tokens:";
    public const string PermissionsCatalog = "permissions:catalog";
    public const string UserProfilePrefix = "profile:user:";
    public const string DashboardSummaryPrefix = "dashboard:summary:";

    public static string TokenSession(string userId) => $"{TokenSessionPrefix}{userId}";
    public static string UserProfile(Guid userId) => $"{UserProfilePrefix}{userId}";
    public static string UserProfileWithContext(Guid userId, bool isImpersonating, Guid? workspaceId) =>
        $"{UserProfilePrefix}{userId}:imp={isImpersonating}:ws={workspaceId}";
    public static string DashboardSummary(string scopeKey) => $"{DashboardSummaryPrefix}{scopeKey}";
}
