using System.IdentityModel.Tokens.Jwt;
using Claims = System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Infrastructure.Security;

public static class ClaimTypes
{
    public const string NameIdentifier = Claims.ClaimTypes.NameIdentifier;

    public const string Name = JwtRegisteredClaimNames.Name;

    public const string Permissions = "permissions";

    public const string Role = "roles";

    public const string PreferredUserName = "preferred_username";

    public const string RequirePasswordChange = "require_password_change";

    public const string ImpersonationOriginalUserId = "impersonation_original_user_id";

    public const string WorkspaceId = "workspace_id";

    public const string Subject = JwtRegisteredClaimNames.Sub;
}
