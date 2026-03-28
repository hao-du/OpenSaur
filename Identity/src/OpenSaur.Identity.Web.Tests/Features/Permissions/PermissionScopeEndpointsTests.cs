using System.Net;
using System.Net.Http.Headers;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Features.PermissionScopes.GetPermissionScopes;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.Permissions;

public sealed class PermissionScopeEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public PermissionScopeEndpointsTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await FirstPartyApiTestClient.InitializeFactoryAsync(_factory);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task GetPermissionScopes_WhenCallerCanManage_ReturnsSeededScopes()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/permission-scope/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetPermissionScopesResponse>>(response);

        var administratorScope = Assert.Single(payload, scope => scope.Id == PermissionScopeCatalog.AdministratorPermissionScopeId);
        Assert.Equal("Administrator", administratorScope.Name);
        Assert.False(string.IsNullOrWhiteSpace(administratorScope.Description));
    }
}

