using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Infrastructure.Helpers;

internal static class ClaimHelper
{
    public static Guid GetCurrentUserId(ClaimsPrincipal user)
    {
        var subject = user.FindFirstValue(Constants.ClaimTypes.Subject) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(subject, out var userId) ? userId : Guid.Empty;
    }

    public static Guid? GetWorkspaceId(ClaimsPrincipal user)
    {
        var workspaceIdValue = user.FindFirst(Constants.ClaimTypes.WorkspaceId)?.Value;
        return Guid.TryParse(workspaceIdValue, out var workspaceId) ? workspaceId : null;
    }

    public static bool IsSuperAdministrator(ClaimsPrincipal user)
    {
        if (IsImpersonating(user))
        {
            return false;
        }

        var isSuperAdmin = user.FindAll(Constants.ClaimTypes.Roles)
            .Any(claim => StringHelper.NormalizeRoleValue(claim.Value) == StringHelper.NormalizeRoleValue(Constants.NormalizedSuperAdministrator));

        return isSuperAdmin;
    }

    public static bool IsImpersonating(ClaimsPrincipal user)
    {
        return user.HasClaim(claim =>
            claim.Type == Constants.ClaimTypes.ImpersonationOriginalUserId
            && !string.IsNullOrWhiteSpace(claim.Value));
    }

    public static bool HasPermission(ClaimsPrincipal user, string permissionCode)
    {
        var hasPermission = user.FindAll(Constants.ClaimTypes.Permissions)
            .Any(claim => string.Equals(claim.Value, permissionCode, StringComparison.Ordinal));

        return hasPermission;
    }
}
