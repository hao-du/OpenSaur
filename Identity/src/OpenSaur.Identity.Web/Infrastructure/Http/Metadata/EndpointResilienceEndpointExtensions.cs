using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

public static class EndpointResilienceExtensions
{
    public static TBuilder RequireIdempotency<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        // Mark the endpoint so the middleware knows this route requires an Idempotency-Key for writes.
        builder.Add(endpointBuilder => EnsureMetadata(endpointBuilder).RequiresIdempotency = true);
        return builder;
    }

    public static TBuilder WithResilienceScope<TBuilder>(
        this TBuilder builder,
        EndpointResiliencePolicyScope scope)
        where TBuilder : IEndpointConventionBuilder
    {
        // Assign a stricter or alternate rate-limit scope to this endpoint at mapping time.
        builder.Add(endpointBuilder => EnsureMetadata(endpointBuilder).PolicyScope = scope);
        return builder;
    }

    private static EndpointResilienceMetadata EnsureMetadata(EndpointBuilder endpointBuilder)
    {
        // Reuse an existing metadata instance so multiple extension calls enrich the same endpoint-level object.
        var metadata = endpointBuilder.Metadata.OfType<EndpointResilienceMetadata>().LastOrDefault();
        if (metadata is not null)
        {
            return metadata;
        }

        // Create metadata on demand the first time an endpoint opts into any resilience behavior.
        metadata = new EndpointResilienceMetadata();
        endpointBuilder.Metadata.Add(metadata);
        return metadata;
    }
}
