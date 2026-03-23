namespace OpenSaur.Identity.Web.Infrastructure.Resilience;

public static class EndpointResilienceExtensions
{
    public static TBuilder RequireIdempotency<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new EndpointIdempotencyMetadata());
        return builder;
    }

    public static TBuilder WithResilienceScope<TBuilder>(
        this TBuilder builder,
        EndpointResiliencePolicyScope scope)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new EndpointResilienceScopeMetadata(scope));
        return builder;
    }
}
