using System.Security.Claims;

namespace OpenSaur.Umbraco.Web.Authentication;

internal sealed record OpenSaurIdentitySession(
    Guid? EffectiveUserId,
    string Subject,
    string UserName,
    string DisplayName,
    string Email,
    Guid WorkspaceId,
    bool IsSuperAdministrator,
    bool IsImpersonating)
{
    public string WorkspaceGroupName => WorkspaceId.ToString();

    public string WorkspaceGroupAlias => WorkspaceId.ToString();

    public static bool TryCreate(ClaimsPrincipal principal, out OpenSaurIdentitySession? session)
    {
        session = null;

        var subject = principal.FindFirstValue(OpenSaurIdentityClaimTypes.Subject)?.Trim();
        if (string.IsNullOrWhiteSpace(subject))
        {
            return false;
        }

        var workspaceIdValue = principal.FindFirstValue(OpenSaurIdentityClaimTypes.WorkspaceId)?.Trim();
        if (!Guid.TryParse(workspaceIdValue, out var workspaceId))
        {
            return false;
        }

        var email = principal.FindFirstValue(OpenSaurIdentityClaimTypes.Email)?.Trim();
        if (string.IsNullOrWhiteSpace(email))
        {
            email = $"{subject}@opensaur.invalid";
        }

        var userName = principal.FindFirstValue(OpenSaurIdentityClaimTypes.PreferredUserName)?.Trim();
        if (string.IsNullOrWhiteSpace(userName))
        {
            userName = principal.FindFirstValue(OpenSaurIdentityClaimTypes.Name)?.Trim();
        }

        if (string.IsNullOrWhiteSpace(userName))
        {
            userName = email;
        }

        var displayName = principal.FindFirstValue(OpenSaurIdentityClaimTypes.Name)?.Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = userName;
        }

        var isSuperAdministrator = principal.FindAll(OpenSaurIdentityClaimTypes.Role)
            .Any(claim => string.Equals(claim.Value, "SUPERADMINISTRATOR", StringComparison.OrdinalIgnoreCase));

        var hasUmbracoManagePermission = principal.FindAll(OpenSaurIdentityClaimTypes.Permissions)
            .Any(claim => string.Equals(claim.Value, "Umbraco.CanManage", StringComparison.Ordinal));

        if (!isSuperAdministrator && !hasUmbracoManagePermission)
        {
            return false;
        }

        var isImpersonating = string.Equals(
            principal.FindFirstValue(OpenSaurIdentityClaimTypes.ImpersonationActive),
            bool.TrueString,
            StringComparison.OrdinalIgnoreCase);

        session = new OpenSaurIdentitySession(
            Guid.TryParse(subject, out var userId) ? userId : null,
            subject,
            userName,
            displayName,
            email,
            workspaceId,
            isSuperAdministrator,
            isImpersonating);

        return true;
    }
}
