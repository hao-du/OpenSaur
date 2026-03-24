using System.Security.Claims;
using Microsoft.AspNetCore.Routing;
using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

public sealed class EndpointResilienceContextResolver
{
    public EndpointResilienceContext Resolve(HttpContext httpContext)
    {
        // Gather all endpoint-level resilience decisions once so downstream middleware can use a single resolved context.
        var metadata = httpContext.GetEndpoint()?.Metadata.GetMetadata<EndpointResilienceMetadata>();

        return new EndpointResilienceContext(
            ResolvePolicyScope(httpContext, metadata),
            ResolveCallerScopeKey(httpContext),
            ResolveEndpointKey(httpContext),
            ResolveRequiresIdempotency(httpContext, metadata));
    }

    private static EndpointResiliencePolicyScope ResolvePolicyScope(
        HttpContext httpContext,
        EndpointResilienceMetadata? metadata)
    {
        // Application endpoints can opt into a named policy scope with endpoint metadata.
        if (metadata?.PolicyScope is not null)
        {
            return metadata.PolicyScope.Value;
        }

        // OpenIddict owns /connect/token, so we use a small path-based fallback instead of endpoint metadata there.
        if (httpContext.Request.Path.Equals("/connect/token", StringComparison.OrdinalIgnoreCase))
        {
            return EndpointResiliencePolicyScope.Token;
        }

        // Everything else uses the default rate-limit policy unless a stricter scope was explicitly assigned.
        return EndpointResiliencePolicyScope.Default;
    }

    private static string ResolveCallerScopeKey(HttpContext httpContext)
    {
        // Authenticated callers are partitioned by subject/user id so one user's traffic does not consume another user's quota.
        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            var subject = httpContext.User.FindFirstValue(ApplicationClaimTypes.Subject)
                          ?? httpContext.User.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(subject))
            {
                return $"user:{subject}";
            }
        }

        // Anonymous callers fall back to client IP because there is no authenticated identity to partition on.
        return $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
    }

    private static string ResolveEndpointKey(HttpContext httpContext)
    {
        // Route pattern text is more stable than the raw URL path, so dynamic ids do not create separate cache/partition keys.
        if (httpContext.GetEndpoint() is RouteEndpoint routeEndpoint
            && !string.IsNullOrWhiteSpace(routeEndpoint.RoutePattern.RawText))
        {
            return routeEndpoint.RoutePattern.RawText;
        }

        // If no route pattern is available, fall back to the current request path.
        return httpContext.Request.Path.Value ?? "/";
    }

    private static bool ResolveRequiresIdempotency(
        HttpContext httpContext,
        EndpointResilienceMetadata? metadata)
    {
        // Idempotency is only meaningful for mutating requests.
        // We explicitly check the HTTP method here so GET/HEAD-style reads are never treated as replayable writes.
        if (!HttpMethods.IsPost(httpContext.Request.Method) && !HttpMethods.IsPut(httpContext.Request.Method))
        {
            return false;
        }

        // The method check alone is not enough; the endpoint must also opt in via metadata.
        return metadata?.RequiresIdempotency == true;
    }
}
