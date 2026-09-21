namespace OpenSaur.Zentry.Web.Infrastructure.Lock;

public interface ILockService
{
    Task<bool> TryAcquireLockAsync(string lockKey, TimeSpan timeout, CancellationToken cancellationToken = default);

    Task ReleaseLockAsync(string lockKey, CancellationToken cancellationToken = default);
}

