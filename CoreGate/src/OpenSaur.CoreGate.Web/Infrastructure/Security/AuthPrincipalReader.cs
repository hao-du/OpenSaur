using System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Infrastructure.Security;

internal static class AuthPrincipalReader
{
    public static string? GetUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ApplicationClaimTypes.Subject)
               ?? principal.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
    }

    public static Guid? GetWorkspaceId(ClaimsPrincipal principal)
    {
        var workspaceId = principal.FindFirstValue(ApplicationClaimTypes.WorkspaceId);

        return Guid.TryParse(workspaceId, out var parsedWorkspaceId)
            ? parsedWorkspaceId
            : null;
    }
}
