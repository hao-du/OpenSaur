using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace;
using OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace;
using OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaces;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.Workspaces;

public sealed class WorkspaceEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public WorkspaceEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetWorkspaces_WhenCallerIsAdministrator_ReturnsOnlyCurrentWorkspace()
    {
        var administratorCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, administratorCredentials.UserName, administratorCredentials.Password, [StandardRoleNames.Administrator]);
        var otherWorkspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, administratorCredentials.UserName, administratorCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/workspace/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetWorkspacesResponse>>(response);
        Assert.Single(payload);
        Assert.DoesNotContain(payload, workspace => workspace.Id == otherWorkspaceId);
    }

    [Fact]
    public async Task GetWorkspaces_WhenWorkspaceHasAssignedRolesAndCapacity_ReturnsPreviewData()
    {
        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var roleOneId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Content Writer");
        var roleTwoId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Task Manager");
        var roleThreeId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Reviewer");
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, roleOneId);
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, roleTwoId);
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, roleThreeId);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Id == workspaceId);
            workspace.MaxActiveUsers = 25;
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/workspace/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);
        var workspaceSummary = payload.EnumerateArray().Single(candidate => candidate.GetProperty("id").GetGuid() == workspaceId);

        Assert.Equal(25, workspaceSummary.GetProperty("maxActiveUsers").GetInt32());
        var assignedRoleIds = workspaceSummary.GetProperty("assignedRoleIds")
            .EnumerateArray()
            .Select(static item => item.GetGuid())
            .ToArray();

        Assert.Contains(roleOneId, assignedRoleIds);
        Assert.Contains(roleTwoId, assignedRoleIds);
        Assert.Contains(roleThreeId, assignedRoleIds);
    }

    [Fact]
    public async Task GetWorkspaceById_WhenAdministratorTargetsDifferentWorkspace_ReturnsNotFound()
    {
        var administratorCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, administratorCredentials.UserName, administratorCredentials.Password, [StandardRoleNames.Administrator]);
        var otherWorkspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, administratorCredentials.UserName, administratorCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/workspace/getbyid/{otherWorkspaceId}");
        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PostCreate_WhenCallerIsAdministrator_ReturnsForbidden()
    {
        var administratorCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, administratorCredentials.UserName, administratorCredentials.Password, [StandardRoleNames.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, administratorCredentials.UserName, administratorCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new CreateWorkspaceRequest(TestFakers.CreateWorkspaceName(), TestFakers.CreateDescription()));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task PostCreate_WhenCallerIsSuperAdministrator_CreatesWorkspace()
    {
        var workspaceName = TestFakers.CreateWorkspaceName();

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new CreateWorkspaceRequest(workspaceName, TestFakers.CreateDescription()));

        await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Name == workspaceName);

        Assert.True(workspace.IsActive);
    }

    [Fact]
    public async Task PostCreate_WhenMaxActiveUsersProvided_PersistsLimitAndReturnsItFromGetById()
    {
        var workspaceName = TestFakers.CreateWorkspaceName();

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var createResponse = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new CreateWorkspaceRequest(workspaceName, TestFakers.CreateDescription(), null, 5));
        var createPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(createResponse);
        var workspaceId = createPayload.GetProperty("id").GetGuid();

        var getResponse = await client.GetAsync($"/api/workspace/getbyid/{workspaceId}");
        var getPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(getResponse);

        Assert.Equal(5, getPayload.GetProperty("maxActiveUsers").GetInt32());

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Id == workspaceId);

        Assert.Equal(5, workspace.MaxActiveUsers);
    }

    [Fact]
    public async Task PostCreate_WhenAssignedRoleIdsAreProvided_PersistsWorkspaceRoleAvailabilityAndReturnsItFromGetById()
    {
        var workspaceName = TestFakers.CreateWorkspaceName();
        var availableRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Content Writer");
        var excludedRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Task Manager");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var createResponse = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new
            {
                Name = workspaceName,
                Description = TestFakers.CreateDescription(),
                AssignedRoleIds = new[] { availableRoleId }
            });
        var createPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(createResponse);
        var workspaceId = createPayload.GetProperty("id").GetGuid();

        var getResponse = await client.GetAsync($"/api/workspace/getbyid/{workspaceId}");
        var getPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(getResponse);
        var assignedRoleIds = getPayload.GetProperty("assignedRoleIds")
            .EnumerateArray()
            .Select(static roleId => roleId.GetGuid())
            .ToArray();

        Assert.Contains(availableRoleId, assignedRoleIds);
        Assert.DoesNotContain(excludedRoleId, assignedRoleIds);
    }

    [Fact]
    public async Task PutEdit_WhenCallerIsSuperAdministrator_UpdatesWorkspaceAndCanDeactivateIt()
    {
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/edit",
            new EditWorkspaceRequest(
                workspaceId,
                "Updated Workspace",
                TestFakers.CreateDescription(),
                false));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Id == workspaceId);

        Assert.Equal("Updated Workspace", workspace.Name);
        Assert.False(workspace.IsActive);
    }

    [Fact]
    public async Task PutEdit_WhenAssignedRoleIdsRemoveWorkspaceRole_DeactivatesMatchingUserRoleAssignments()
    {
        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var userId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "OperationsWriter",
            TestFakers.CreatePassword(),
            [],
            workspaceName: workspaceName);
        var retainedRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Operations Manager");
        var removedRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Content Writer");
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, retainedRoleId);
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, removedRoleId);
        await TestIdentitySeeder.SeedUserRoleAsync(_factory, userId, retainedRoleId);
        var removedAssignmentId = await TestIdentitySeeder.SeedUserRoleAsync(_factory, userId, removedRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/edit",
            new
            {
                Id = workspaceId,
                Name = workspaceName,
                Description = TestFakers.CreateDescription(),
                IsActive = true,
                AssignedRoleIds = new[] { retainedRoleId }
            });

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var removedAssignment = await dbContext.UserRoles.SingleAsync(candidate => candidate.Id == removedAssignmentId);

        Assert.False(removedAssignment.IsActive);
    }

    [Fact]
    public async Task PutEdit_WhenLimitIsLoweredBelowCurrentActiveUsers_AllowsSaveAndPersistsLimit()
    {
        const string workspaceName = "Capacity Workspace";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "CapacityUserOne",
            TestFakers.CreatePassword(),
            [StandardRoleNames.User],
            workspaceName: workspaceName);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "CapacityUserTwo",
            TestFakers.CreatePassword(),
            [StandardRoleNames.User],
            workspaceName: workspaceName);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/edit",
            new EditWorkspaceRequest(
                workspaceId,
                workspaceName,
                TestFakers.CreateDescription(),
                true,
                null,
                1));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Id == workspaceId);
        var activeUserCount = await dbContext.Users.CountAsync(candidate => candidate.WorkspaceId == workspaceId && candidate.IsActive);

        Assert.Equal(1, workspace.MaxActiveUsers);
        Assert.Equal(2, activeUserCount);
    }
}

