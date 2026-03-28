using System.Security.Claims;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth;

internal static class AuthPrincipalReader
{
    public static string? GetUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ApplicationClaimTypes.Subject)
               ?? principal.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
    }

    public static bool GetRequirePasswordChange(ClaimsPrincipal principal)
    {
        return bool.TryParse(
            principal.FindFirstValue(ApplicationClaimTypes.RequirePasswordChange),
            out var requirePasswordChange)
            && requirePasswordChange;
    }

    public static Guid? GetImpersonationOriginalUserId(ClaimsPrincipal principal)
    {
        var originalUserId = principal.FindFirstValue(ApplicationClaimTypes.ImpersonationOriginalUserId);

        return Guid.TryParse(originalUserId, out var parsedOriginalUserId)
            ? parsedOriginalUserId
            : null;
    }

    public static Guid? GetImpersonationWorkspaceId(ClaimsPrincipal principal)
    {
        var workspaceId = principal.FindFirstValue(ApplicationClaimTypes.ImpersonationWorkspaceId);

        return Guid.TryParse(workspaceId, out var parsedWorkspaceId)
            ? parsedWorkspaceId
            : null;
    }

    public static Guid? GetWorkspaceId(ClaimsPrincipal principal)
    {
        var workspaceId = principal.FindFirstValue(ApplicationClaimTypes.WorkspaceId);

        return Guid.TryParse(workspaceId, out var parsedWorkspaceId)
            ? parsedWorkspaceId
            : null;
    }

    public static bool IsImpersonating(ClaimsPrincipal principal)
    {
        return bool.TryParse(
                   principal.FindFirstValue(ApplicationClaimTypes.ImpersonationActive),
                   out var isImpersonating)
               && isImpersonating;
    }
}
