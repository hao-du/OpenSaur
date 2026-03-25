using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Features.Roles.CreateRole;
using OpenSaur.Identity.Web.Features.Roles.EditRole;
using OpenSaur.Identity.Web.Features.Roles.GetRoleById;
using OpenSaur.Identity.Web.Features.Roles.GetRoles;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.Roles;

public sealed class RoleEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public RoleEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetRoles_WhenCallerCanManage_ReturnsSeededRoles()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/role/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetRolesResponse>>(response);
        Assert.Contains(payload, role => role.Name == SystemRoles.Administrator);
        Assert.Contains(payload, role => role.Name == SystemRoles.SuperAdministrator);
        Assert.Contains(payload, role => role.Name == SystemRoles.User);
    }

    [Fact]
    public async Task GetRoleById_WhenRoleExists_ReturnsAssignedPermissionCodeIds()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        Guid administratorRoleId;
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            administratorRoleId = await dbContext.Roles
                .Where(role => role.Name == SystemRoles.Administrator)
                .Select(role => role.Id)
                .SingleAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/role/getbyid/{administratorRoleId}");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<GetRoleByIdResponse>(response);
        Assert.Equal(administratorRoleId, payload.Id);
        Assert.Contains((int)PermissionCode.Administrator_CanManage, payload.PermissionCodeIds);
    }

    [Fact]
    public async Task PostCreate_WhenCallerCanManage_CreatesRoleWithAssignedPermissions()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        var roleName = TestFakers.CreateRoleName();

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/role/create",
            new CreateRoleRequest(
                roleName,
                TestFakers.CreateDescription(),
                [(int)PermissionCode.Administrator_CanManage]));

        await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var role = await dbContext.Roles.SingleAsync(candidate => candidate.Name == roleName);
        var permissionAssignments = await dbContext.RolePermissions
            .Where(candidate => candidate.RoleId == role.Id)
            .ToListAsync();

        Assert.Single(permissionAssignments);
        Assert.True(permissionAssignments[0].IsActive);
    }

    [Fact]
    public async Task PutEdit_WhenCallerCanManage_UpdatesRoleAndDeactivatesRemovedAssignments()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var roleId = await TestIdentitySeeder.SeedRoleAsync(
            _factory,
            TestFakers.CreateRoleName(),
            [(int)PermissionCode.Administrator_CanManage]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/role/edit",
            new EditRoleRequest(
                roleId,
                "Updated Role",
                TestFakers.CreateDescription(),
                IsActive: false,
                PermissionCodeIds: []));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var role = await dbContext.Roles.SingleAsync(candidate => candidate.Id == roleId);
        var permissionAssignments = await dbContext.RolePermissions
            .Where(candidate => candidate.RoleId == roleId)
            .ToListAsync();

        Assert.Equal("Updated Role", role.Name);
        Assert.False(role.IsActive);
        Assert.NotEmpty(permissionAssignments);
        Assert.All(permissionAssignments, assignment => Assert.False(assignment.IsActive));
    }
}
