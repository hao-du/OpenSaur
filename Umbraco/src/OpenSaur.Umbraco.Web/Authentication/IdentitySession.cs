using Umbraco.Extensions;
using System.Security.Claims;

namespace OpenSaur.Umbraco.Web.Authentication;

internal sealed record IdentitySession(
    Guid? EffectiveUserId,
    string Subject,
    string UserName,
    string DisplayName,
    string Email,
    Guid WorkspaceId,
    string WorkspaceName,
    bool IsSuperAdministrator,
    bool IsImpersonating)
{
    public string WorkspaceGroupName => WorkspaceName;

    public string WorkspaceGroupAlias { 
        get
        {
            var id = WorkspaceId.ToString("N");
            return $"workspace{char.ToUpper(id[0])}{id.Substring(1)}";
        }
    }

    public string LegacyWorkspaceGroupAlias => WorkspaceId.ToString();

    public static bool TryCreate(ClaimsPrincipal principal, out IdentitySession? session)
    {
        session = null;

        var isImpersonating = IsImpersonatingFunc(principal);
        var isSuperAdministrator = IsSuperAdministratorFunc(principal);
        var hasUmbracoManagePermission = HasPermission(principal, "Umbraco.CanManage");

        if (!isSuperAdministrator && !hasUmbracoManagePermission)
        {
            return false;
        }

        var subject = principal.FindFirstValue(ClaimTypes.Subject)?.Trim();
        if (string.IsNullOrWhiteSpace(subject))
        {
            return false;
        }

        var workspaceIdValue = principal.FindFirstValue(ClaimTypes.WorkspaceId)?.Trim();
        if (!Guid.TryParse(workspaceIdValue, out var workspaceId))
        {
            return false;
        }
        var workspaceName = principal.FindFirstValue(ClaimTypes.WorkspaceName)?.Trim() ?? workspaceIdValue;

        var email = principal.FindFirstValue(ClaimTypes.Email)?.Trim();
        if (string.IsNullOrWhiteSpace(email))
        {
            email = $"{subject}@opensaur.invalid";
        }

        var userName = principal.FindFirstValue(ClaimTypes.PreferredUserName)?.Trim();
        if (string.IsNullOrWhiteSpace(userName))
        {
            userName = principal.FindFirstValue(ClaimTypes.Name)?.Trim();
        }
        if (string.IsNullOrWhiteSpace(userName))
        {
            userName = email;
        }

        var displayName = principal.FindFirstValue(ClaimTypes.Name)?.Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = userName;
        }

        session = new IdentitySession(
            Guid.TryParse(subject, out var userId) ? userId : null,
            subject,
            userName,
            displayName,
            email,
            workspaceId,
            workspaceName,
            isSuperAdministrator,
            isImpersonating);

        return true;
    }

    private static bool IsImpersonatingFunc(ClaimsPrincipal principal)
    {
        return principal.HasClaim(claim =>
            claim.Type == ClaimTypes.ImpersonationOriginalUserId
            && !string.IsNullOrWhiteSpace(claim.Value));
    }

    private static bool IsSuperAdministratorFunc(ClaimsPrincipal principal)
    {
        if (IsImpersonatingFunc(principal))
        {
            return false;
        }

        var isSuperAdmin = principal.FindAll(ClaimTypes.Roles)
            .Any(claim => NormalizeRoleValue(claim.Value) == NormalizeRoleValue("SUPER ADMINISTRATOR"));

        return isSuperAdmin;
    }

    public static bool HasPermission(ClaimsPrincipal user, string permissionCode)
    {
        var hasPermission = user.FindAll(ClaimTypes.Permissions)
            .Any(claim => string.Equals(claim.Value, permissionCode, StringComparison.Ordinal));

        return hasPermission;
    }

    private static string NormalizeRoleValue(string value)
    {
        return new string([.. value
            .Where(char.IsLetterOrDigit)
            .Select(char.ToUpperInvariant)]);
    }
}
