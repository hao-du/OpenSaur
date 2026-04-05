using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace OpenSaur.Identity.Web.Features.Auth.Oidc;

internal static class IssuerAuthenticationFlow
{
    public static string BuildCurrentRequestPathAndQuery(HttpContext httpContext)
    {
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
        await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        return ChallengeIssuerLogin(httpContext);
    }
}
