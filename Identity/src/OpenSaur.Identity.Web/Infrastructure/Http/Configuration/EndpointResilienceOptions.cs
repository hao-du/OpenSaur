using OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;
using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Configuration;

public sealed class EndpointResilienceOptions
{
    public const string SectionName = "EndpointResilience";

    // Rate-limit thresholds grouped by endpoint scope.
    public EndpointRateLimitingOptions RateLimiting { get; init; } = new();

    // Shared idempotency settings for opted-in mutating endpoints.
    public EndpointIdempotencyOptions Idempotency { get; init; } = new();
}
