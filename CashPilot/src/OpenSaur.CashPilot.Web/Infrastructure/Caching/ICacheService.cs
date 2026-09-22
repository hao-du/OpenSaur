namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public interface ICacheService
{
    ValueTask<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

    ValueTask SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);

    ValueTask RemoveAsync(string key, CancellationToken cancellationToken = default);

    ValueTask<T?> WaitForValueAsync<T>(string key, int maxAttempts = 10, TimeSpan? delayBetweenAttempts = null, CancellationToken cancellationToken = default);
}

