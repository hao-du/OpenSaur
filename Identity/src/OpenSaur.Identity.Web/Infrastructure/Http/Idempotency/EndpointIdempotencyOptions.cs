namespace OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;

public sealed class EndpointIdempotencyOptions
{
    // Header clients must send when retry-protecting a supported write endpoint.
    public string HeaderName { get; init; } = "Idempotency-Key";

    // How long the first completed response stays replayable in cache.
    public int ReplayRetentionMinutes { get; init; } = 5;
}
