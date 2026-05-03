using OpenSaur.Gateway.ConfigurationOptions;

namespace OpenSaur.Gateway.Infrastructure.Middleware.CurcuitBreaker;

sealed class GatewayCircuitBreaker
{
    private readonly GatewayCircuitBreakerOptions _options;
    private readonly object _gate = new();
    private int _consecutiveFailures;
    private DateTimeOffset? _openUntilUtc;

    public GatewayCircuitBreaker(GatewayCircuitBreakerOptions options)
    {
        _options = options;
    }

    public bool TryRejectRequest(out TimeSpan retryAfter)
    {
        lock (_gate)
        {
            var now = DateTimeOffset.UtcNow;
            if (_openUntilUtc is { } openUntil && openUntil > now)
            {
                retryAfter = openUntil - now;
                return true;
            }

            _openUntilUtc = null;
            retryAfter = TimeSpan.Zero;
            return false;
        }
    }

    public void ReportResult(int statusCode)
    {
        lock (_gate)
        {
            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                _consecutiveFailures++;
                if (_consecutiveFailures >= _options.FailureThreshold)
                {
                    _openUntilUtc = DateTimeOffset.UtcNow.AddSeconds(_options.BreakDurationSeconds);
                    _consecutiveFailures = 0;
                }
                return;
            }

            _consecutiveFailures = 0;
        }
    }
}
