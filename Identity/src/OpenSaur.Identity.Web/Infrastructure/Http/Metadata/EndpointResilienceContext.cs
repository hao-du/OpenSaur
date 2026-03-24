using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

public sealed record EndpointResilienceContext(
    // Which rate-limit bucket the endpoint belongs to.
    EndpointResiliencePolicyScope PolicyScope,
    // Which caller bucket the request belongs to (for example user id or IP).
    string CallerScopeKey,
    // A stable endpoint identity used in idempotency cache keys.
    string EndpointKey,
    // Whether this request should enter the idempotency flow at all.
    bool RequiresIdempotency);
