using OpenSaur.CoreGate.Web.Infrastructure.Security;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class CookieService
{
    private const string RefreshCookiePath = "/auth/";

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
                HttpOnly = true,
                IsEssential = true,
                Path = RefreshCookiePath,
                SameSite = SameSiteMode.None,
                Secure = true
            });
    }

    private static CookieOptions CreateCookieOptions()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            IsEssential = true,
            Path = RefreshCookiePath,
            SameSite = SameSiteMode.None,
            Secure = true
        };
    }
}
