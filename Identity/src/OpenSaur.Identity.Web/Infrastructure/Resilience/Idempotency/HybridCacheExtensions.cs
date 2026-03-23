using Microsoft.Extensions.Caching.Hybrid;

namespace OpenSaur.Identity.Web.Infrastructure.Resilience.Idempotency;

public static class HybridCacheExtensions
{
    public static async Task<(bool Found, T? Value)> TryGetAsync<T>(
        this HybridCache cache,
        string key,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var value = await cache.GetOrCreateAsync<T>(
                key,
                static _ => throw CacheMissException.Instance,
                cancellationToken: cancellationToken);

            return (true, value);
        }
        catch (CacheMissException)
        {
            return (false, default);
        }
    }

    private sealed class CacheMissException : Exception
    {
        public static readonly CacheMissException Instance = new();

        private CacheMissException()
        {
        }
    }
}
