using System.Collections.Concurrent;

namespace OpenSaur.Identity.Web.Infrastructure.Resilience.CircuitBreaker;

public sealed class InboundCircuitBreakerStateStore
{
    private readonly ConcurrentDictionary<string, CircuitState> _states = new();

    public CircuitLease TryEnter(string key, DateTime utcNow)
    {
        var state = _states.GetOrAdd(key, static _ => new CircuitState());

        lock (state.SyncRoot)
        {
            if (!state.IsOpen)
            {
                return CircuitLease.Allow();
            }

            if (utcNow < state.OpenUntilUtc)
            {
                return CircuitLease.Reject();
            }

            if (state.ProbeInProgress)
            {
                return CircuitLease.Reject();
            }

            state.ProbeInProgress = true;
            return CircuitLease.AllowProbe();
        }
    }

    public void RecordSuccess(string key, CircuitLease lease)
    {
        var state = _states.GetOrAdd(key, static _ => new CircuitState());

        lock (state.SyncRoot)
        {
            state.ConsecutiveFailures = 0;

            if (lease.IsProbe || state.IsOpen)
            {
                state.IsOpen = false;
                state.OpenUntilUtc = DateTime.MinValue;
                state.ProbeInProgress = false;
            }
        }
    }

    public void RecordFailure(
        string key,
        CircuitLease lease,
        int failureThreshold,
        TimeSpan breakDuration,
        DateTime utcNow)
    {
        var state = _states.GetOrAdd(key, static _ => new CircuitState());

        lock (state.SyncRoot)
        {
            if (lease.IsProbe)
            {
                OpenCircuit(state, breakDuration, utcNow);
                return;
            }

            state.ConsecutiveFailures++;
            if (state.ConsecutiveFailures < failureThreshold)
            {
                return;
            }

            OpenCircuit(state, breakDuration, utcNow);
        }
    }

    private static void OpenCircuit(CircuitState state, TimeSpan breakDuration, DateTime utcNow)
    {
        state.IsOpen = true;
        state.OpenUntilUtc = utcNow.Add(breakDuration);
        state.ProbeInProgress = false;
        state.ConsecutiveFailures = 0;
    }

    private sealed class CircuitState
    {
        public object SyncRoot { get; } = new();

        public bool IsOpen { get; set; }

        public bool ProbeInProgress { get; set; }

        public int ConsecutiveFailures { get; set; }

        public DateTime OpenUntilUtc { get; set; }
    }
}

public readonly record struct CircuitLease(bool IsAllowed, bool IsProbe)
{
    public static CircuitLease Allow()
    {
        return new CircuitLease(true, false);
    }

    public static CircuitLease AllowProbe()
    {
        return new CircuitLease(true, true);
    }

    public static CircuitLease Reject()
    {
        return new CircuitLease(false, false);
    }
}
