using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace OpenSaur.CashPilot.Web.Infrastructure.Lock;

public class RedisDistributedLockService(
    IConnectionMultiplexer redis,
    ILogger<RedisDistributedLockService> logger) : ILockService
{
    // The placeholder value stored in Redis to indicate the key is actively locked.
    private const string LockPayload = "locked";

    public async Task<bool> TryAcquireLockAsync(string lockKey, TimeSpan timeout, CancellationToken cancellationToken = default)
    {
        try
        {
            var db = redis.GetDatabase();
            return await db.StringSetAsync(lockKey, LockPayload, timeout, When.NotExists);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to acquire Redis distributed lock for key {LockKey}.", lockKey);
            return true; // Fall back to allowing progress
        }
    }

    public async Task ReleaseLockAsync(string lockKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var db = redis.GetDatabase();
            await db.KeyDeleteAsync(lockKey);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to release Redis distributed lock for key {LockKey}.", lockKey);
        }
    }
}

