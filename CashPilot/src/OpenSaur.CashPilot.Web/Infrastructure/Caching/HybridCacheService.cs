using Microsoft.Extensions.Caching.Hybrid;

namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public sealed class HybridCacheService(HybridCache hybridCache) : IHybridCacheService
{
    public async Task<T?> GetOrCreateAsync<T>(string key, Func<string, Task<T>> factory, TimeSpan? expiresIn = null)
    {
        HybridCacheEntryOptions? options = expiresIn is not null
            ? new HybridCacheEntryOptions { Expiration = expiresIn.Value }
            : null;

        return await hybridCache.GetOrCreateAsync<T>(
            key,
            async (_) => await factory(key),
            options);
    }

    public async Task RemoveAsync(string key)
    {
        await hybridCache.RemoveAsync(key);
    }
}
