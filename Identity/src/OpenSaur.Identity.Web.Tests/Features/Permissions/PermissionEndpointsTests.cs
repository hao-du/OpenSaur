using System.Net;
using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.Permissions;

public sealed class PermissionEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public PermissionEndpointsTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await _factory.ResetDatabaseAsync();
        await _factory.SeedOidcClientAsync(
            FirstPartyApiTestClient.ClientId,
            FirstPartyApiTestClient.RedirectUri,
            FirstPartyApiTestClient.ClientSecret);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task GetPermissions_WhenCallerCanManage_ReturnsDisplayMetadata()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/permission/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<PermissionResponse>>(response);

        var administratorCanManage = Assert.Single(payload, permission => permission.CodeId == (int)PermissionCode.Administrator_CanManage);
        Assert.Equal("Administrator.CanManage", administratorCanManage.Code);
        Assert.False(string.IsNullOrWhiteSpace(administratorCanManage.Name));
        Assert.False(string.IsNullOrWhiteSpace(administratorCanManage.Description));
        Assert.Equal(PermissionScopeCatalog.AdministratorPermissionScopeId, administratorCanManage.PermissionScopeId);
        Assert.Equal("Administrator", administratorCanManage.PermissionScopeName);

        Assert.Contains(payload, permission => permission.CodeId == (int)PermissionCode.Administrator_CanView);
    }

    [Fact]
    public async Task GetPermissionById_WhenPermissionExists_ReturnsSelectionPayload()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        int codeId;
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            codeId = await dbContext.Permissions
                .Where(permission => permission.CodeId == (int)PermissionCode.Administrator_CanManage)
                .Select(permission => permission.CodeId)
                .SingleAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/permission/getbyid/{codeId}");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<PermissionResponse>(response);
        Assert.Equal(codeId, payload.CodeId);
        Assert.Equal("Administrator.CanManage", payload.Code);
        Assert.Equal(PermissionScopeCatalog.AdministratorPermissionScopeId, payload.PermissionScopeId);
        Assert.Equal("Administrator", payload.PermissionScopeName);
    }

    private sealed record PermissionResponse(
        Guid Id,
        int CodeId,
        Guid PermissionScopeId,
        string PermissionScopeName,
        string Code,
        string Name,
        string Description,
        bool IsActive);
}
