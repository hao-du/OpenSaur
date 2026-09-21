using Microsoft.Extensions.Caching.Hybrid;

namespace OpenSaur.CoreGate.Web.Infrastructure.Caching;

public interface ICacheService
{
    ValueTask<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, ValueTask<T>> factory,
        TimeSpan? expiration = null,
        TimeSpan? localCacheExpiration = null,
        IEnumerable<string>? tags = null,
        CancellationToken cancellationToken = default);

    ValueTask RemoveAsync(string key, CancellationToken cancellationToken = default);

    ValueTask RemoveByTagAsync(string tag, CancellationToken cancellationToken = default);
}

public sealed class CacheService(HybridCache hybridCache) : ICacheService
{
    private static readonly TimeSpan DefaultCacheExpiration = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan DefaultLocalCacheExpiration = TimeSpan.FromSeconds(30);

    public ValueTask<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, ValueTask<T>> factory,
        TimeSpan? expiration = null,
        TimeSpan? localCacheExpiration = null,
        IEnumerable<string>? tags = null,
        CancellationToken cancellationToken = default)
    {
        var options = new HybridCacheEntryOptions
        {
            Expiration = expiration ?? DefaultCacheExpiration,
            LocalCacheExpiration = localCacheExpiration ?? DefaultLocalCacheExpiration
        };

        return hybridCache.GetOrCreateAsync(
            key,
            factory,
            options,
            tags,
            cancellationToken);
    }

    public ValueTask RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        return hybridCache.RemoveAsync(key, cancellationToken);
    }

    public ValueTask RemoveByTagAsync(string tag, CancellationToken cancellationToken = default)
    {
        return hybridCache.RemoveByTagAsync(tag, cancellationToken);
    }
}

