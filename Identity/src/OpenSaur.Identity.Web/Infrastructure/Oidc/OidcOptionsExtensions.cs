using Microsoft.AspNetCore.Http;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public static class OidcOptionsExtensions
{
    public static string[] GetFirstPartyScopes(this OidcOptions oidcOptions)
    {
        return oidcOptions.GetHostedIdentityClient().Scope
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    public static string BuildFirstPartyRedirectUri(this HttpContext httpContext)
    {
        var redirectPath = httpContext.Request.PathBase.Add("/auth/callback");

        return new UriBuilder(
            httpContext.Request.Scheme,
            httpContext.Request.Host.Host,
            httpContext.Request.Host.Port ?? -1)
        {
            Path = redirectPath.Value
        }.Uri.AbsoluteUri;
    }
}
