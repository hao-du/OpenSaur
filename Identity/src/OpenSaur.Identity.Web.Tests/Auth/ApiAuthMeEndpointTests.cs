using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Auth;

public sealed class ApiAuthMeEndpointTests : IClassFixture<OpenSaurWebApplicationFactory>
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public ApiAuthMeEndpointTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMe_WhenAnonymous_ReturnsUnauthorized()
    {
        using var client = _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer)
            });

        var response = await client.GetAsync("/api/auth/me");

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Unauthorized);
    }
}
