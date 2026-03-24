using System.Collections.Concurrent;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;

public sealed class IdempotencyRequestLockProvider
{
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new(StringComparer.Ordinal);

    public async Task<IAsyncDisposable> AcquireAsync(string key, CancellationToken cancellationToken)
    {
        // The lock scope is per idempotency cache key and only protects duplicate requests inside this process.
        var gate = _locks.GetOrAdd(key, static _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        return new Releaser(gate);
    }

    private sealed class Releaser : IAsyncDisposable
    {
        private readonly SemaphoreSlim _gate;

        public Releaser(SemaphoreSlim gate)
        {
            _gate = gate;
        }

        public ValueTask DisposeAsync()
        {
            // Releasing the semaphore allows the next waiting duplicate request to observe the cached response.
            _gate.Release();
            return ValueTask.CompletedTask;
        }
    }
}
