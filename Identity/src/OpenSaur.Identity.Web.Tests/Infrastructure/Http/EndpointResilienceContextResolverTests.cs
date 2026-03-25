using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;
using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Http;

public sealed class EndpointResilienceContextResolverTests
{
    [Fact]
    public void Resolve_WhenEndpointHasMetadata_ReturnsAnnotatedScopeAndIdempotency()
    {
        var httpContext = CreateHttpContext(HttpMethods.Post, "/api/test/custom");
        httpContext.SetEndpoint(
            CreateEndpoint(
                "/api/test/custom",
                new EndpointResilienceMetadata
                {
                    PolicyScope = EndpointResiliencePolicyScope.Auth,
                    RequiresIdempotency = true
                }));

        var resolver = new EndpointResilienceContextResolver();

        var context = resolver.Resolve(httpContext);

        Assert.Equal(EndpointResiliencePolicyScope.Auth, context.PolicyScope);
        Assert.True(context.RequiresIdempotency);
        Assert.Equal("/api/test/custom", context.EndpointKey);
        Assert.Equal("ip:unknown", context.CallerScopeKey);
    }

    [Fact]
    public void Resolve_WhenCallerIsAuthenticated_UsesUserScopeKey()
    {
        var httpContext = CreateHttpContext(HttpMethods.Get, "/api/test/default");
        httpContext.User = new ClaimsPrincipal(
            new ClaimsIdentity(
                [new Claim(ApplicationClaimTypes.Subject, Guid.Empty.ToString())],
                authenticationType: "Bearer"));

        var resolver = new EndpointResilienceContextResolver();

        var context = resolver.Resolve(httpContext);

        Assert.Equal($"user:{Guid.Empty}", context.CallerScopeKey);
        Assert.Equal(EndpointResiliencePolicyScope.Default, context.PolicyScope);
        Assert.False(context.RequiresIdempotency);
        Assert.Equal("/api/test/default", context.EndpointKey);
    }

    [Fact]
    public void Resolve_WhenEndpointIsConnectTokenWithoutMetadata_UsesTokenScopeFallback()
    {
        var httpContext = CreateHttpContext(HttpMethods.Post, "/connect/token");
        var resolver = new EndpointResilienceContextResolver();

        var context = resolver.Resolve(httpContext);

        Assert.Equal(EndpointResiliencePolicyScope.Token, context.PolicyScope);
        Assert.False(context.RequiresIdempotency);
        Assert.Equal("/connect/token", context.EndpointKey);
    }

    private static DefaultHttpContext CreateHttpContext(string method, string path)
    {
        return new DefaultHttpContext
        {
            Request =
            {
                Method = method,
                Path = path
            }
        };
    }

    private static Endpoint CreateEndpoint(string routePattern, params object[] metadataItems)
    {
        var builder = new RouteEndpointBuilder(
            static context => Task.CompletedTask,
            RoutePatternFactory.Parse(routePattern),
            0);

        foreach (var metadataItem in metadataItems)
        {
            builder.Metadata.Add(metadataItem);
        }

        return builder.Build();
    }
}
