using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

public sealed class EndpointResilienceMetadata
{
    // Optional rate-limit scope override for this endpoint.
    public EndpointResiliencePolicyScope? PolicyScope { get; set; }

    // Indicates that POST/PUT requests to this endpoint participate in idempotency handling.
    public bool RequiresIdempotency { get; set; }
}
