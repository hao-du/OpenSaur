using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using OpenSaur.CoreGate.Web.Infrastructure.Caching;

namespace OpenSaur.CoreGate.Web.Infrastructure.Security;

public class UserSessionCookieStore(
    IDistributedCache distributedCache,
    ILogger<UserSessionCookieStore> logger) : ITicketStore
{
    private static readonly TimeSpan DefaultSlidingExpiration = TimeSpan.FromDays(7);

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var sessionId = GenerateSessionId();
        var cacheKey = CacheKeys.Session(sessionId);

        await SaveTicketAsync(cacheKey, ticket);
        logger.LogDebug("Created user session {SessionId}", sessionId);

        return sessionId;
    }

    public async Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        var cacheKey = CacheKeys.Session(key);
        await SaveTicketAsync(cacheKey, ticket);
        logger.LogDebug("Renewed user session {SessionId}", key);
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        var cacheKey = CacheKeys.Session(key);
        var bytes = await distributedCache.GetAsync(cacheKey);
        if (bytes == null || bytes.Length == 0)
        {
            return null;
        }

        try
        {
            return TicketSerializer.Default.Deserialize(bytes);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to deserialize authentication ticket for session {SessionId}", key);
            return null;
        }
    }

    public async Task RemoveAsync(string key)
    {
        var cacheKey = CacheKeys.Session(key);
        await distributedCache.RemoveAsync(cacheKey);
        logger.LogDebug("Removed user session {SessionId}", key);
    }

    private async Task SaveTicketAsync(string cacheKey, AuthenticationTicket ticket)
    {
        var bytes = TicketSerializer.Default.Serialize(ticket);
        var expiresAt = ticket.Properties.ExpiresUtc;

        var options = new DistributedCacheEntryOptions();
        if (expiresAt.HasValue)
        {
            options.SetAbsoluteExpiration(expiresAt.Value);
        }
        else
        {
            options.SetSlidingExpiration(DefaultSlidingExpiration);
        }

        await distributedCache.SetAsync(cacheKey, bytes, options);
    }

    private static string GenerateSessionId()
    {
        Span<byte> randomBytes = stackalloc byte[24];
        RandomNumberGenerator.Fill(randomBytes);
        return $"s_{Convert.ToHexString(randomBytes).ToLowerInvariant()}";
    }
}

