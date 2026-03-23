using Microsoft.AspNetCore.Routing;

namespace OpenSaur.Identity.Web.Infrastructure.Resilience;

public static class EndpointResiliencePolicySelector
{
    public static EndpointResiliencePolicyScope SelectScope(HttpContext httpContext)
    {
        var endpointScope = httpContext.GetEndpoint()?.Metadata.GetMetadata<EndpointResilienceScopeMetadata>();
        if (endpointScope is not null)
        {
            return endpointScope.Scope;
        }

        if (IsTokenPath(httpContext.Request.Path))
        {
            return EndpointResiliencePolicyScope.Token;
        }

        return EndpointResiliencePolicyScope.Default;
    }

    public static bool RequiresIdempotency(HttpContext httpContext)
    {
        var method = httpContext.Request.Method;
        if (!HttpMethods.IsPost(method) && !HttpMethods.IsPut(method))
        {
            return false;
        }

        return httpContext.GetEndpoint()?.Metadata.GetMetadata<EndpointIdempotencyMetadata>() is not null;
    }

    public static string GetEndpointScopeKey(HttpContext httpContext)
    {
        if (httpContext.GetEndpoint() is RouteEndpoint routeEndpoint
            && !string.IsNullOrWhiteSpace(routeEndpoint.RoutePattern.RawText))
        {
            return routeEndpoint.RoutePattern.RawText;
        }

        return httpContext.Request.Path.Value ?? "/";
    }
    private static bool IsTokenPath(PathString path)
    {
        return path.Equals("/connect/token", StringComparison.OrdinalIgnoreCase);
    }
}
