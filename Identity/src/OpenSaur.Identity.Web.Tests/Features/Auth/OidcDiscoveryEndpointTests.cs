using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace OpenSaur.Identity.Web.Tests.Features.Auth;

public sealed class OidcDiscoveryEndpointTests : IClassFixture<OpenSaurWebApplicationFactory>
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public OidcDiscoveryEndpointTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetDiscoveryDocument_WhenOidcConfigured_ReturnsConfiguredIssuer()
    {
        using var client = _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer)
            });

        var response = await client.GetAsync("/.well-known/openid-configuration");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        await using var responseStream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(responseStream);
        var root = document.RootElement;

        Assert.Equal(
            OpenSaurWebApplicationFactory.Issuer.TrimEnd('/'),
            root.GetProperty("issuer").GetString()!.TrimEnd('/'));
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("token_endpoint").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("authorization_endpoint").GetString()));
    }
}
