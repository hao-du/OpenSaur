namespace OpenSaur.Gateway.ConfigurationOptions;

sealed class GatewayCircuitBreakerOptions
{
    public int FailureThreshold { get; init; } = 5;
    public int BreakDurationSeconds { get; init; } = 30;
}
