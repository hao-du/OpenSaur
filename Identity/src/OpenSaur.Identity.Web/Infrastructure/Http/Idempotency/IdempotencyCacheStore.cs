using Microsoft.Extensions.Caching.Hybrid;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;

public sealed class IdempotencyCacheStore
{
    private readonly HybridCache _cache;

    public IdempotencyCacheStore(HybridCache cache)
    {
        _cache = cache;
    }

    public async Task<IdempotencyCacheEntry?> GetAsync(string cacheKey, CancellationToken cancellationToken)
    {
        // HybridCache does not expose a direct TryGet API, so cache misses are normalized to null here.
        try
        {
            return await _cache.GetOrCreateAsync<IdempotencyCacheEntry>(
                cacheKey,
                static _ => throw CacheMissException.Instance,
                cancellationToken: cancellationToken);
        }
        catch (CacheMissException)
        {
            return null;
        }
    }

    public ValueTask SetAsync(
        string cacheKey,
        IdempotencyCacheEntry entry,
        TimeSpan retention,
        CancellationToken cancellationToken)
    {
        // The same retention is applied to both local and distributed cache layers so replay behavior stays consistent.
        var entryOptions = new HybridCacheEntryOptions
        {
            Expiration = retention,
            LocalCacheExpiration = retention
        };

        return _cache.SetAsync(cacheKey, entry, entryOptions, cancellationToken: cancellationToken);
    }

    private sealed class CacheMissException : Exception
    {
        public static readonly CacheMissException Instance = new();

        private CacheMissException()
        {
        }
    }
}
