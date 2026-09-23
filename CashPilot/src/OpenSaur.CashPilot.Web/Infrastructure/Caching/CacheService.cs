using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public class CacheService(
    HybridCache hybridCache,
    ILogger<CacheService> logger) : ICacheService, IHybridCacheService
{
    private static readonly TimeSpan DefaultWaitDelay = TimeSpan.FromMilliseconds(300);

    public async ValueTask<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            return await hybridCache.GetOrCreateAsync<T?>(
                key,
                _ => ValueTask.FromResult<T?>(default),
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to retrieve key {Key} from HybridCache.", key);
            return default;
        }
    }

    public async ValueTask SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var entryOptions = expiration.HasValue
                ? new HybridCacheEntryOptions
                {
                    Expiration = expiration.Value,
                    // Keep L1 in-memory lifespan short (at most 15s or half the total duration) so other nodes refresh from L2 quickly
                    LocalCacheExpiration = expiration.Value > TimeSpan.FromSeconds(30)
                        ? TimeSpan.FromSeconds(15)
                        : TimeSpan.FromSeconds(Math.Max(1, expiration.Value.TotalSeconds / 2))
                }
                : null;

            await hybridCache.SetAsync(key, value, entryOptions, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to set key {Key} in HybridCache.", key);
        }
    }

    public async ValueTask RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await hybridCache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to remove key {Key} from HybridCache.", key);
        }
    }

    public async ValueTask<T?> WaitForValueAsync<T>(
        string key,
        int maxAttempts = 10,
        TimeSpan? delayBetweenAttempts = null,
        CancellationToken cancellationToken = default)
    {
        var delay = delayBetweenAttempts ?? DefaultWaitDelay;
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            await Task.Delay(delay, cancellationToken);
            var value = await GetAsync<T>(key, cancellationToken);
            if (value is not null)
            {
                return value;
            }
        }

        return default;
    }

    // Compatibility implementation for existing IHybridCacheService callers
    public async Task<T?> GetOrCreateAsync<T>(string key, Func<string, Task<T>> factory, TimeSpan? expiresIn = null)
    {
        var options = expiresIn.HasValue
            ? new HybridCacheEntryOptions
            {
                Expiration = expiresIn.Value,
                LocalCacheExpiration = expiresIn.Value > TimeSpan.FromSeconds(30)
                    ? TimeSpan.FromSeconds(15)
                    : TimeSpan.FromSeconds(Math.Max(1, expiresIn.Value.TotalSeconds / 2))
            }
            : null;

        return await hybridCache.GetOrCreateAsync<T>(
            key,
            async (_) => await factory(key),
            options);
    }

    Task IHybridCacheService.RemoveAsync(string key)
    {
        return RemoveAsync(key).AsTask();
    }

    public async Task<string> GetVersionAsync(string versionKey)
    {
        try
        {
            var version = await hybridCache.GetOrCreateAsync(
                versionKey,
                _ => ValueTask.FromResult(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()));
            return version ?? "0";
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to get version for key {Key} from HybridCache.", versionKey);
            return "0";
        }
    }

    public async Task<string> BumpVersionAsync(string versionKey)
    {
        var newVersion = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        try
        {
            await hybridCache.SetAsync(versionKey, newVersion);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to bump version for key {Key} in HybridCache.", versionKey);
        }

        return newVersion;
    }
}

