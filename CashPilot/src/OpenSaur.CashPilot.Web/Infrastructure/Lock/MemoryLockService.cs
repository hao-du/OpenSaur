using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace OpenSaur.CashPilot.Web.Infrastructure.Lock;

public class MemoryLockService(ILogger<MemoryLockService> logger) : ILockService
{
    private sealed class LockEntry : IDisposable
    {
        public SemaphoreSlim Semaphore { get; } = new(1, 1);
        public Timer? ExpirationTimer { get; set; }

        public void Dispose()
        {
            ExpirationTimer?.Dispose();
            Semaphore.Dispose();
        }
    }

    private static readonly ConcurrentDictionary<string, LockEntry> LocalLocks = new();

    public async Task<bool> TryAcquireLockAsync(string lockKey, TimeSpan timeout, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = LocalLocks.GetOrAdd(lockKey, _ => new LockEntry());

            var acquired = await entry.Semaphore.WaitAsync(TimeSpan.Zero, cancellationToken);
            if (!acquired)
            {
                return false;
            }

            // Set up timer for auto-expiration if holder fails to release
            entry.ExpirationTimer?.Dispose();
            entry.ExpirationTimer = new Timer(_ =>
            {
                _ = ReleaseLockAsync(lockKey, CancellationToken.None);
            }, null, timeout, Timeout.InfiniteTimeSpan);

            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to acquire in-memory lock for key {LockKey}.", lockKey);
            return true; // Fall back to allowing progress
        }
    }

    public Task ReleaseLockAsync(string lockKey, CancellationToken cancellationToken = default)
    {
        if (LocalLocks.TryRemove(lockKey, out var entry))
        {
            try
            {
                entry.ExpirationTimer?.Dispose();
                if (entry.Semaphore.CurrentCount == 0)
                {
                    entry.Semaphore.Release();
                }
                entry.Dispose();
            }
            catch (Exception ex)
            {
                logger.LogTrace(ex, "Lock {LockKey} was already disposed or released.", lockKey);
            }
        }

        return Task.CompletedTask;
    }
}

