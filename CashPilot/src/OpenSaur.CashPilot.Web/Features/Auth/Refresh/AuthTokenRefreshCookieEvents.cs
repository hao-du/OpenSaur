using System.Globalization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Infrastructure.Lock;

namespace OpenSaur.CashPilot.Web.Features.Auth.Refresh;

public class AuthTokenRefreshCookieEvents(
    ITokenService tokenService,
    ICacheService cacheService,
    ILockService lockService,
    ILogger<AuthTokenRefreshCookieEvents> logger) : CookieAuthenticationEvents
{
    private static readonly TimeSpan RefreshWindow = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan LockTimeout = TimeSpan.FromSeconds(30);

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

        var userId = (context.Principal != null ? ClaimHelper.GetCurrentUserId(context.Principal) : Guid.Empty).ToString();
        var cacheKey = CacheConstants.TokenSessionKey(userId);
        var lockKey = LockKeys.TokenRefresh(userId);

        // Check if another concurrent request has already refreshed the token session
        var cachedSession = await cacheService.GetAsync<CachedTokenSession>(cacheKey, context.HttpContext.RequestAborted);
        if (cachedSession is not null
            && DateTimeOffset.TryParse(cachedSession.ExpiresAt, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var cachedExpiresAt)
            && cachedExpiresAt - DateTimeOffset.UtcNow > RefreshWindow)
        {
            UpdateTokensToCookieStore(context, cachedSession.AccessToken, cachedSession.RefreshToken, cachedSession.ExpiresAt);
            return;
        }

        // Check or acquire distributed lock to coordinate parallel requests
        var lockAcquired = await lockService.TryAcquireLockAsync(lockKey, LockTimeout, context.HttpContext.RequestAborted);
        if (!lockAcquired)
        {
            // Another thread/instance is refreshing; wait and check cache
            var awaitedSession = await cacheService.WaitForValueAsync<CachedTokenSession>(cacheKey, cancellationToken: context.HttpContext.RequestAborted);
            if (awaitedSession is not null)
            {
                UpdateTokensToCookieStore(context, awaitedSession.AccessToken, awaitedSession.RefreshToken, awaitedSession.ExpiresAt);
                return;
            }

            // If wait timed out but access token is still within validity, allow to proceed
            if (expiresAt > DateTimeOffset.UtcNow)
            {
                return;
            }

            logger.LogWarning("Concurrent token refresh lock could not be acquired and access token expired.");
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(AuthConstants.DefaultCookieScheme);
            return;
        }

        try
        {
            var refreshResult = await tokenService.RefreshTokenAsync(refreshToken, context.HttpContext.RequestAborted);
            if (refreshResult == null)
            {
                // Only reject principal if the access token has actually expired
                if (expiresAt <= DateTimeOffset.UtcNow)
                {
                    logger.LogWarning("Rejected principal because token refresh failed and access token is expired.");
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(AuthConstants.DefaultCookieScheme);
                }
                else
                {
                    logger.LogWarning("Token refresh failed, but access token is still valid until {ExpiresAt}. Allowing request to proceed.", expiresAt);
                }
                return;
            }

            var newExpiresAt = DateTimeOffset.UtcNow.AddSeconds(refreshResult.ExpiresIn).ToString("o", CultureInfo.InvariantCulture);

            // Store in cache so concurrent parallel requests use the new tokens
            var newSession = new CachedTokenSession(refreshResult.AccessToken, refreshResult.RefreshToken, newExpiresAt);
            await cacheService.SetAsync(cacheKey, newSession, TimeSpan.FromSeconds(refreshResult.ExpiresIn), context.HttpContext.RequestAborted);

            UpdateTokensToCookieStore(context, refreshResult.AccessToken, refreshResult.RefreshToken, newExpiresAt);
            logger.LogInformation("Silent token refresh succeeded. Ticket renewed until {ExpiresAt}", newExpiresAt);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception during token refresh in AuthTokenRefreshCookieEvents.");
            if (expiresAt <= DateTimeOffset.UtcNow)
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(AuthConstants.DefaultCookieScheme);
            }
        }
        finally
        {
            if (lockAcquired)
            {
                await lockService.ReleaseLockAsync(lockKey, CancellationToken.None);
            }
        }
    }

    private static void UpdateTokensToCookieStore(
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
        context.Properties.ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7);
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

