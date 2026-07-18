using Microsoft.Extensions.Options;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;
using OpenSaur.CoreGate.Web.Infrastructure.Security;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class CookieService(IOptions<AuthCookieOptions> authCookieOptions)
{
    private const string RefreshCookiePath = "/auth/";
    private readonly string? cookieDomain = AuthCookieDomainNormalizer.Normalize(authCookieOptions.Value.Domain);

    public void WriteRefreshTokenCookie(HttpResponse response, string refreshToken)
    {
        response.Cookies.Append(
            CookieNames.Refresh,
            refreshToken,
            CreateCookieOptions());
    }

    public string? ReadRefreshTokenCookie(HttpRequest request)
    {
        return request.Cookies.TryGetValue(CookieNames.Refresh, out var refreshToken)
            ? refreshToken
            : null;
    }

    public void ClearRefreshTokenCookie(HttpResponse response)
    {
        response.Cookies.Delete(
            CookieNames.Refresh,
            new CookieOptions
            {
                Domain = cookieDomain,
                HttpOnly = true,
                IsEssential = true,
                Path = RefreshCookiePath,
                SameSite = SameSiteMode.None,
                Secure = true
            });
    }

    private CookieOptions CreateCookieOptions()
    {
        return new CookieOptions
        {
            Domain = cookieDomain,
            HttpOnly = true,
            IsEssential = true,
            Path = RefreshCookiePath,
            SameSite = SameSiteMode.None,
            Secure = true
        };
    }
}
