using System.Globalization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Auth.Refresh;

public class AuthTokenRefreshCookieEvents(
    ITokenService tokenService,
    ILogger<AuthTokenRefreshCookieEvents> logger) : CookieAuthenticationEvents
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

        try
        {
            var refreshResult = await tokenService.RefreshTokenAsync(refreshToken, context.HttpContext.RequestAborted);
            if (refreshResult == null)
            {
                logger.LogWarning("Rejected principal because token refresh failed.");
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(AuthConstants.DefaultCookieScheme);
                return;
            }

            var newExpiresAt = DateTimeOffset.UtcNow.AddSeconds(refreshResult.ExpiresIn).ToString("o", CultureInfo.InvariantCulture);
            ApplyTokens(context, refreshResult.AccessToken, refreshResult.RefreshToken, newExpiresAt);
            logger.LogInformation("Silent token refresh succeeded. Ticket renewed until {ExpiresAt}", newExpiresAt);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception during token refresh in AuthTokenRefreshCookieEvents.");
        }
    }

    private static void ApplyTokens(
        CookieValidatePrincipalContext context,
        string accessToken,
        string refreshToken,
        string expiresAt)
    {
        var tokens = new List<AuthenticationToken>
        {
            new() { Name = "access_token", Value = accessToken },
            new() { Name = "refresh_token", Value = refreshToken },
            new() { Name = "expires_at", Value = expiresAt }
        };

        var idToken = context.Properties.GetTokenValue("id_token");
        if (!string.IsNullOrWhiteSpace(idToken))
        {
            tokens.Add(new AuthenticationToken { Name = "id_token", Value = idToken });
        }

        context.Properties.StoreTokens(tokens);
        context.ShouldRenew = true;
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

