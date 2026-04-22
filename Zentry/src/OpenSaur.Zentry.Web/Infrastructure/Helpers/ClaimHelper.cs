using System.Security.Claims;
using OpenIddict.Abstractions;

namespace OpenSaur.Zentry.Web.Infrastructure.Helpers;

internal static class ClaimHelper
{
    public static Guid GetCurrentUserId(ClaimsPrincipal user)
    {
        var subject = user.FindFirstValue(OpenIddictConstants.Claims.Subject)
                      ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(subject, out var userId) ? userId : Guid.Empty;
    }
}
