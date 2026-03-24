namespace OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

public enum EndpointResiliencePolicyScope
{
    // Normal application endpoints.
    Default = 0,

    // Interactive authentication/account endpoints.
    Auth = 1,

    // OIDC token/authorization protocol endpoints.
    Token = 2
}
