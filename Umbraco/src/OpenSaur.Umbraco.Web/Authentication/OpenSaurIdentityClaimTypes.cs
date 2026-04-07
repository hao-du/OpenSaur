namespace OpenSaur.Umbraco.Web.Authentication;

internal static class OpenSaurIdentityClaimTypes
{
    public const string Subject = "sub";
    public const string Name = "name";
    public const string PreferredUserName = "preferred_username";
    public const string Email = "email";
    public const string Role = "roles";
    public const string Permissions = "permissions";
    public const string WorkspaceId = "workspace_id";
    public const string ImpersonationActive = "impersonation_active";
    public const string ImpersonationOriginalUserId = "impersonation_original_user_id";
    public const string ImpersonationWorkspaceId = "impersonation_workspace_id";
}
