using System.Security.Claims;
using OpenIddict.Abstractions;

namespace OpenSaur.Zentry.Web.Infrastructure.Helpers;

internal static class ClaimHelper
{
    public const string WorkspaceIdClaimType = "workspace_id";
    public const string PermissionClaimType = "permissions";
    public const string RoleClaimType = "roles";

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
        var isSuperAdmin = user.FindAll(RoleClaimType)
            .Any(claim => StringHelper.NormalizeRoleValue(claim.Value) == StringHelper.NormalizeRoleValue(Constants.NormalizedSuperAdministrator));

        return isSuperAdmin;
    }

    public static bool HasPermission(ClaimsPrincipal user, string permissionCode)
    {
        var hasPermission = user.FindAll(PermissionClaimType)
            .Any(claim => string.Equals(claim.Value, permissionCode, StringComparison.Ordinal));

        return hasPermission;
    }
}
