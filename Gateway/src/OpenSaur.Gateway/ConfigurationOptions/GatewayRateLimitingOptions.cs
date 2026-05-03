namespace OpenSaur.Gateway.ConfigurationOptions;

sealed class GatewayRateLimitingOptions
{
    public int PermitLimit { get; init; } = 100;
    public int QueueLimit { get; init; } = 0;
    public int WindowSeconds { get; init; } = 10;
}
