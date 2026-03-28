using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace OpenSaur.Identity.Web.Infrastructure.Security;

public static class ApplicationClaimTypes
{
    public const string NameIdentifier = ClaimTypes.NameIdentifier;

    public const string Name = JwtRegisteredClaimNames.Name;

    public const string Role = "roles";

    public const string PreferredUserName = "preferred_username";

    public const string RequirePasswordChange = "require_password_change";

    public const string ImpersonationActive = "impersonation_active";

    public const string ImpersonationOriginalUserId = "impersonation_original_user_id";

    public const string ImpersonationWorkspaceId = "impersonation_workspace_id";

    public const string WorkspaceId = "workspace_id";

    public const string Subject = JwtRegisteredClaimNames.Sub;

    public const string TokenId = JwtRegisteredClaimNames.Jti;
}
