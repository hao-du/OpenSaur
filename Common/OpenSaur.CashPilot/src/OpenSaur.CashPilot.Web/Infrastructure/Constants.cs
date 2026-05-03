namespace OpenSaur.CashPilot.Web.Infrastructure;

internal static class Constants
{
    public const string NormalizedSuperAdministrator = "SUPER ADMINISTRATOR";

    public static class Permissions
    {
        public static class CashPilot
        {
            public const string CanManage = "CashPilot.CanManage";
        }
    }

    public static class ClaimTypes
    {
        public const string WorkspaceId = "workspace_id";
        public const string Permissions = "permissions";
        public const string Roles = "roles";
        public const string ImpersonationOriginalUserId = "impersonation_original_user_id";
        public const string Subject = "sub";
    }
}
