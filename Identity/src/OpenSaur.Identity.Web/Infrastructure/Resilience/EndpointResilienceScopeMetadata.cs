namespace OpenSaur.Identity.Web.Infrastructure.Resilience;

public sealed class EndpointResilienceScopeMetadata
{
    public EndpointResilienceScopeMetadata(EndpointResiliencePolicyScope scope)
    {
        Scope = scope;
    }

    public EndpointResiliencePolicyScope Scope { get; }
}
