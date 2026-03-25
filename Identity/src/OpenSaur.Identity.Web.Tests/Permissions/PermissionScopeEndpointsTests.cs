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

public sealed class PermissionScopeEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public PermissionScopeEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetPermissionScopes_WhenCallerCanManage_ReturnsSeededScopes()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/permission-scope/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<PermissionScopeResponse>>(response);

        var administratorScope = Assert.Single(payload, scope => scope.Id == PermissionScopeCatalog.AdministratorPermissionScopeId);
        Assert.Equal("Administrator", administratorScope.Name);
        Assert.False(string.IsNullOrWhiteSpace(administratorScope.Description));
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

    private sealed record PermissionScopeResponse(Guid Id, string Name, string Description, bool IsActive);
}
