namespace OpenSaur.Umbraco.Web.Authentication;

internal static class ClaimTypes
{
    public const string Subject = "sub";
    public const string Name = "name";
    public const string PreferredUserName = "preferred_username";
    public const string Email = "email";
    public const string Roles = "roles";
    public const string Permissions = "permissions";
    public const string WorkspaceId = "workspace_id";
    public const string WorkspaceName = "workspace_name";
    public const string ImpersonationOriginalUserId = "impersonation_original_user_id";
    public const string ImpersonatedUserId = "impersonated_user_id";
}
