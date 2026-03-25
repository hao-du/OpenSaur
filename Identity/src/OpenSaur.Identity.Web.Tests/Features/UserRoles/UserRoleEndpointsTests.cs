using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole;
using OpenSaur.Identity.Web.Features.UserRoles.EditUserRole;
using OpenSaur.Identity.Web.Features.UserRoles.GetUserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.UserRoles;

public sealed class UserRoleEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public UserRoleEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetUserRoles_WhenCallerCanManageWorkspace_ReturnsOnlySameWorkspaceAssignments()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var sameWorkspaceUserCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var sameWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            sameWorkspaceUserCredentials.UserName,
            sameWorkspaceUserCredentials.Password,
            []);
        var otherWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [],
            workspaceName: TestFakers.CreateWorkspaceName());
        var sameWorkspaceRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        var otherWorkspaceRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());

        await TestIdentitySeeder.SeedUserRoleAsync(_factory, sameWorkspaceUserId, sameWorkspaceRoleId);
        await TestIdentitySeeder.SeedUserRoleAsync(_factory, otherWorkspaceUserId, otherWorkspaceRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user-role/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetUserRolesResponse>>(response);
        Assert.Contains(payload, assignment => assignment.UserId == sameWorkspaceUserId);
        Assert.DoesNotContain(payload, assignment => assignment.UserId == otherWorkspaceUserId);
    }

    [Fact]
    public async Task PostCreate_WhenCallerCanManageWorkspace_CreatesUserRoleAssignment()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, []);
        var roleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/user-role/create",
            new CreateUserRoleRequest(targetUserId, roleId, TestFakers.CreateDescription()));

        await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var assignment = await dbContext.UserRoles.SingleAsync(
            candidate => candidate.UserId == targetUserId && candidate.RoleId == roleId);

        Assert.True(assignment.IsActive);
        Assert.False(string.IsNullOrWhiteSpace(assignment.Description));
    }

    [Fact]
    public async Task PostCreate_WhenRequestShapeIsInvalid_ReturnsValidationEnvelope()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/user-role/create",
            new CreateUserRoleRequest(Guid.Empty, Guid.Empty, new string('x', 300)));
        var payload = await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);

        Assert.All(payload.Errors, static error => Assert.Equal("validation_error", error.Code));
        Assert.All(payload.Errors, static error => Assert.False(string.IsNullOrWhiteSpace(error.Message)));
        Assert.All(payload.Errors, static error => Assert.False(string.IsNullOrWhiteSpace(error.Detail)));
    }

    [Fact]
    public async Task PutEdit_WhenCallerCanManageWorkspace_UpdatesAssignmentAndCanDeactivateIt()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, []);
        var originalRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        var replacementRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        var assignmentId = await TestIdentitySeeder.SeedUserRoleAsync(_factory, targetUserId, originalRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user-role/edit",
            new EditUserRoleRequest(
                assignmentId,
                replacementRoleId,
                TestFakers.CreateDescription(),
                false));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var assignment = await dbContext.UserRoles.SingleAsync(candidate => candidate.Id == assignmentId);

        Assert.Equal(replacementRoleId, assignment.RoleId);
        Assert.False(assignment.IsActive);
    }

    [Fact]
    public async Task PutEdit_WhenCallerTargetsDifferentWorkspace_ReturnsNotFound()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            targetCredentials.UserName,
            targetCredentials.Password,
            [],
            workspaceName: TestFakers.CreateWorkspaceName());
        var roleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        var assignmentId = await TestIdentitySeeder.SeedUserRoleAsync(_factory, targetUserId, roleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user-role/edit",
            new EditUserRoleRequest(
                assignmentId,
                roleId,
                TestFakers.CreateDescription(),
                true));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.NotFound);
    }
}
