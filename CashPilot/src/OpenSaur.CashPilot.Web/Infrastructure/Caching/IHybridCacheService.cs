namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public interface IHybridCacheService
{
    Task<T?> GetOrCreateAsync<T>(string key, Func<string, Task<T>> factory, TimeSpan? expiresIn = null);
    Task RemoveAsync(string key);
}
