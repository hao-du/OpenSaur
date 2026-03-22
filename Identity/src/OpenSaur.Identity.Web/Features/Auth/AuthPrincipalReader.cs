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
}
