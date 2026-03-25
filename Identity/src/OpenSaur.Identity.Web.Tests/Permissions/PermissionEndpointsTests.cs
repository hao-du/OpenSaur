using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Permissions;

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
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

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
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

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

    private async Task<Guid> SeedUserAsync(
        string userName,
        string password,
        IEnumerable<string> roles)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var workspace = await dbContext.Workspaces.SingleAsync();
        var existingUser = await userManager.FindByNameAsync(userName);
        if (existingUser is not null)
        {
            return existingUser.Id;
        }

        var user = new ApplicationUser
        {
            UserName = userName,
            Email = TestFakers.CreateEmail(userName),
            RequirePasswordChange = false,
            WorkspaceId = workspace.Id,
            IsActive = true,
            Description = TestFakers.CreateDescription(),
            CreatedBy = Guid.CreateVersion7()
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", createResult.Errors.Select(error => error.Description)));
        }

        if (roles.Any())
        {
            var addRolesResult = await userManager.AddToRolesAsync(user, roles);
            if (!addRolesResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join(", ", addRolesResult.Errors.Select(error => error.Description)));
            }
        }

        return user.Id;
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
