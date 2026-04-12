using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace OpenSaur.Identity.Web.Features.Auth.Oidc;

internal static class IssuerAuthenticationFlow
{
    public static string BuildCurrentRequestPathAndQuery(HttpContext httpContext)
    {
        // The Identity application scheme uses this relative URL after login so the user returns
        // to the original OIDC action, typically /connect/authorize or an impersonation endpoint.
        return $"{httpContext.Request.PathBase}{httpContext.Request.Path}{httpContext.Request.QueryString}";
    }

    public static IResult ChallengeIssuerLogin(HttpContext httpContext)
    {
        return Results.Challenge(
            new AuthenticationProperties
            {
                RedirectUri = BuildCurrentRequestPathAndQuery(httpContext)
            },
            [IdentityConstants.ApplicationScheme]);
    }

    public static async Task<IResult> SignOutAndChallengeIssuerLoginAsync(HttpContext httpContext)
    {
        // If the principal is stale or invalid, clear the local app session first so the next
        // challenge forces a fresh login and claim reconstruction.
        await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        return ChallengeIssuerLogin(httpContext);
    }
}
