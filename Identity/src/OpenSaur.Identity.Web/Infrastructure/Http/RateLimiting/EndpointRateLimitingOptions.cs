namespace OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

public sealed class EndpointRateLimitingOptions
{
    // Baseline policy applied to endpoints that do not opt into a stricter scope.
    public EndpointRateLimitPolicyOptions Default { get; init; } = new();

    // Tighter policy for interactive auth/account routes like login or logout.
    public EndpointRateLimitPolicyOptions Auth { get; init; } = new();

    // Tighter policy for token issuance/exchange endpoints.
    public EndpointRateLimitPolicyOptions Token { get; init; } = new();
}

public sealed class EndpointRateLimitPolicyOptions
{
    // Maximum requests allowed during the configured window.
    public int PermitLimit { get; init; } = 60;

    // Fixed-window length, in seconds.
    public int WindowSeconds { get; init; } = 60;

    // How many extra requests may wait in queue once the permit limit is exhausted.
    public int QueueLimit { get; init; } = 0;
}
