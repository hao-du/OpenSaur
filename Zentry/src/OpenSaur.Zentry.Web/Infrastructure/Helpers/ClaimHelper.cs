using OpenIddict.Abstractions;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Infrastructure.Helpers;

internal static class ClaimHelper
{
    public const string WorkspaceIdClaimType = CoreGateClaimTypes.WorkspaceId;
    public const string PermissionClaimType = CoreGateClaimTypes.Permissions;
    public const string RoleClaimType = ClaimTypes.Role;
    public const string ImpersonationOriginalUserIdClaimType = CoreGateClaimTypes.ImpersonationOriginalUserId;

    public static Guid GetCurrentUserId(ClaimsPrincipal user)
    {
        var subject = user.FindFirstValue(OpenIddictConstants.Claims.Subject)
                      ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(subject, out var userId) ? userId : Guid.Empty;
    }

    public static Guid? GetWorkspaceId(ClaimsPrincipal user)
    {
        var workspaceIdValue = user.FindFirst(WorkspaceIdClaimType)?.Value;
        return Guid.TryParse(workspaceIdValue, out var workspaceId)
            ? workspaceId
            : null;
    }

    public static bool IsSuperAdministrator(ClaimsPrincipal user)
    {
        if (IsImpersonating(user))
        {
            return false;
        }

        var isSuperAdmin = user.FindAll(c => c.Type == RoleClaimType)
            .Any(claim => StringHelper.NormalizeRoleValue(claim.Value) == StringHelper.NormalizeRoleValue(Constants.NormalizedSuperAdministrator));

        return isSuperAdmin;
    }

    public static bool IsImpersonating(ClaimsPrincipal user)
    {
        return user.HasClaim(claim =>
            claim.Type == ImpersonationOriginalUserIdClaimType
            && !string.IsNullOrWhiteSpace(claim.Value));
    }

    public static bool HasPermission(ClaimsPrincipal user, string permissionCode)
    {
        var hasPermission = user.FindAll(PermissionClaimType)
            .Any(claim => string.Equals(claim.Value, permissionCode, StringComparison.Ordinal));

        return hasPermission;
    }
}
