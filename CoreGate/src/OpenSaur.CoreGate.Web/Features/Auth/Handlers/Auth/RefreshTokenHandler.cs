using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Features.Auth.Services;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;

public class RefreshTokenHandler(
    IHttpContextAccessor httpContextAccessor,
    CookieService tokenCookieService,
    TokenService tokenService)
{
    public async Task<IResult> HandleRefreshAsync(TokenRefreshRequest request)
    {
        if (!tokenService.IsAllowedOrigin())
        {
            return Results.Forbid();
        }

        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        var refreshToken = tokenCookieService.ReadRefreshTokenCookie(httpContext.Request);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Results.Unauthorized();
        }

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["client_id"] = request.ClientId,
            ["refresh_token"] = refreshToken
        };

        return await tokenService.ProxyTokenRequestAsync(form, clearRefreshCookieOnFailure: true);
    }
}
