namespace OpenSaur.Identity.Web.Infrastructure.Resilience;

public sealed class EndpointResilienceOptions
{
    public const string SectionName = "EndpointResilience";

    public EndpointRateLimitingOptions RateLimiting { get; init; } = new();

    public EndpointIdempotencyOptions Idempotency { get; init; } = new();

    public EndpointCircuitBreakerOptions CircuitBreaker { get; init; } = new();
}

public sealed class EndpointRateLimitingOptions
{
    public EndpointRateLimitPolicyOptions Default { get; init; } = new();

    public EndpointRateLimitPolicyOptions Auth { get; init; } = new();

    public EndpointRateLimitPolicyOptions Token { get; init; } = new();
}

public sealed class EndpointRateLimitPolicyOptions
{
    public int PermitLimit { get; init; } = 60;

    public int WindowSeconds { get; init; } = 60;

    public int QueueLimit { get; init; } = 0;
}

public sealed class EndpointIdempotencyOptions
{
    public string HeaderName { get; init; } = "Idempotency-Key";

    public int ReplayRetentionMinutes { get; init; } = 5;
}

public sealed class EndpointCircuitBreakerOptions
{
    public EndpointCircuitBreakerPolicyOptions Default { get; init; } = new();

    public EndpointCircuitBreakerPolicyOptions Auth { get; init; } = new();

    public EndpointCircuitBreakerPolicyOptions Token { get; init; } = new();
}

public sealed class EndpointCircuitBreakerPolicyOptions
{
    public int FailureThreshold { get; init; } = 5;

    public int BreakDurationSeconds { get; init; } = 30;
}
