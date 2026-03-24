using OpenSaur.Identity.Web.Infrastructure.Http.Configuration;

namespace OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

public sealed class EndpointResiliencePolicyResolver
{
    private readonly EndpointResilienceOptions _options;

    public EndpointResiliencePolicyResolver(EndpointResilienceOptions options)
    {
        _options = options;
    }

    public EndpointRateLimitPolicyOptions GetRateLimitingPolicy(EndpointResiliencePolicyScope policyScope)
    {
        // Map the resolved endpoint scope to the configured rate-limit thresholds from appsettings.
        return policyScope switch
        {
            EndpointResiliencePolicyScope.Auth => _options.RateLimiting.Auth,
            EndpointResiliencePolicyScope.Token => _options.RateLimiting.Token,
            _ => _options.RateLimiting.Default
        };
    }
}
