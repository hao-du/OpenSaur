using System.Globalization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using OpenSaur.Zentry.Web.Infrastructure.Auth;

namespace OpenSaur.Zentry.Web.Features.Bff.Refresh;

public class BffTokenRefreshCookieEvents(
    ITokenService tokenService,
    ILogger<BffTokenRefreshCookieEvents> logger) : CookieAuthenticationEvents
{
    private static readonly TimeSpan RefreshWindow = TimeSpan.FromMinutes(5);

    public override async Task ValidatePrincipal(CookieValidatePrincipalContext context)
    {
        var expiresAtString = context.Properties.GetTokenValue("expires_at");
        if (string.IsNullOrWhiteSpace(expiresAtString))
        {
            return;
        }

        if (!DateTimeOffset.TryParse(expiresAtString, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var expiresAt))
        {
            return;
        }

        // Only refresh if expiring within the refresh window
        if (expiresAt - DateTimeOffset.UtcNow > RefreshWindow)
        {
            return;
        }

        var refreshToken = context.Properties.GetTokenValue("refresh_token");
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var refreshResult = await tokenService.RefreshTokenAsync(refreshToken, context.HttpContext.RequestAborted);
        if (refreshResult == null)
        {
            logger.LogWarning("BFF rejected principal because token refresh failed.");
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(BffConstants.DefaultCookieScheme);
            return;
        }

        var newExpiresAt = DateTimeOffset.UtcNow.AddSeconds(refreshResult.ExpiresIn).ToString("o", CultureInfo.InvariantCulture);

        var tokens = new List<AuthenticationToken>
        {
            new() { Name = "access_token", Value = refreshResult.AccessToken },
            new() { Name = "refresh_token", Value = refreshResult.RefreshToken },
            new() { Name = "expires_at", Value = newExpiresAt }
        };

        var idToken = context.Properties.GetTokenValue("id_token");
        if (!string.IsNullOrWhiteSpace(idToken))
        {
            tokens.Add(new AuthenticationToken { Name = "id_token", Value = idToken });
        }

        context.Properties.StoreTokens(tokens);
        context.ShouldRenew = true;
        logger.LogInformation("BFF silent token refresh succeeded. Ticket renewed until {ExpiresAt}", newExpiresAt);
    }

    public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> context)
    {
        if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    }

    public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> context)
    {
        if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    }
}

