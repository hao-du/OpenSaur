using Microsoft.AspNetCore.Http;
using OpenSaur.Identity.Web.Features.Auth;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public static class FirstPartySessionCookieExtensions
{
    public static void AppendFirstPartyRefreshToken(this HttpContext httpContext, string refreshToken)
    {
        httpContext.Response.Cookies.Append(
            AuthCookieNames.Refresh,
            refreshToken,
            CreateRefreshCookieOptions(httpContext));
    }

    public static void DeleteFirstPartyRefreshToken(this HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(
            AuthCookieNames.Refresh,
            CreateRefreshCookieOptions(httpContext));
    }

    private static CookieOptions CreateRefreshCookieOptions(HttpContext httpContext)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            IsEssential = true,
            SameSite = SameSiteMode.Lax,
            Secure = httpContext.Request.IsHttps
        };
    }
}
