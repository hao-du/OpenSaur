using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Auth.Me;
using OpenSaur.Identity.Web.Features.Users.ChangeUserPassword;
using OpenSaur.Identity.Web.Features.Users.ChangeWorkspace;
using OpenSaur.Identity.Web.Features.Users.CreateUser;
using OpenSaur.Identity.Web.Features.Users.EditUser;
using OpenSaur.Identity.Web.Features.Users.GetUserById;
using OpenSaur.Identity.Web.Features.Users.GetUsers;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.Users;

public sealed class UserEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public UserEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetUsers_WhenCallerCanManageWorkspace_ReturnsOnlySameWorkspaceUsers()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var sameWorkspaceUserCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");
        await TestIdentitySeeder.SeedUserAsync(_factory, sameWorkspaceUserCredentials.UserName, sameWorkspaceUserCredentials.Password, [StandardRoleNames.User], workspaceName: "Operations");
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetUsersResponse>>(response);
        Assert.Contains(payload, user => user.UserName == sameWorkspaceUserCredentials.UserName);
        Assert.DoesNotContain(payload, user => user.UserName == otherWorkspaceUserCredentials.UserName);
    }

    [Fact]
    public async Task GetUsers_WhenManagedUsersHaveAssignedRoles_ReturnsActiveRoleSummaries()
    {
        const string workspaceName = "Operations";
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();
        var administratorRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Operations Manager");
        var writerRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Content Writer");
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator],
            workspaceName: workspaceName);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            targetCredentials.UserName,
            targetCredentials.Password,
            [],
            workspaceName: workspaceName);
        await TestIdentitySeeder.SeedUserRoleAsync(_factory, targetUserId, administratorRoleId);
        await TestIdentitySeeder.SeedUserRoleAsync(_factory, targetUserId, writerRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);
        var user = payload.EnumerateArray().Single(candidate => candidate.GetProperty("id").GetGuid() == targetUserId);
        var roleNames = user.GetProperty("roles")
            .EnumerateArray()
            .Select(static item => item.GetProperty("name").GetString() ?? string.Empty)
            .OrderBy(static item => item)
            .ToArray();

        Assert.Equal(["Content Writer", "Operations Manager"], roleNames);
    }

    [Fact]
    public async Task GetUserById_WhenCallerTargetsDifferentWorkspace_ReturnsNotFound()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");
        var otherWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/user/getbyid/{otherWorkspaceUserId}");
        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetUserById_WhenCallerIsSuperAdministratorAtAllWorkspaces_ReturnsForbidden()
    {
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/user/getbyid/{otherWorkspaceUserId}");

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetUsers_WhenCallerIsSuperAdministratorAtAllWorkspaces_ReturnsForbidden()
    {
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user/get");

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetUsers_WhenCallerIsAdministratorInPersonalWorkspace_ReturnsForbidden()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            managerCredentials.UserName,
            managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user/get");

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task PostCreate_WhenCallerCanManageWorkspace_CreatesUserInOwnWorkspace()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var newUserCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/user/create",
            new CreateUserRequest(
                newUserCredentials.UserName,
                TestFakers.CreateEmail(newUserCredentials.UserName),
                newUserCredentials.Password,
                TestFakers.CreateDescription(),
                "{\"theme\":\"dark\"}"));

        await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var createdUser = await dbContext.Users.SingleAsync(user => user.UserName == newUserCredentials.UserName);
        var managerUser = await dbContext.Users.SingleAsync(user => user.UserName == managerCredentials.UserName);

        Assert.Equal(managerUser.WorkspaceId, createdUser.WorkspaceId);
        Assert.True(createdUser.RequirePasswordChange);
        Assert.Equal("{\"theme\":\"dark\"}", createdUser.UserSettings);
    }

    [Fact]
    public async Task PostCreate_WhenWorkspaceCapacityIsReached_ReturnsValidationProblem()
    {
        const string workspaceName = "Operations";
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator],
            workspaceName: workspaceName);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "capacity-user",
            TestFakers.CreatePassword(),
            [StandardRoleNames.User],
            workspaceName: workspaceName);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Name == workspaceName);
            workspace.MaxActiveUsers = 2;
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/user/create",
            new CreateUserRequest(
                "blocked-user",
                TestFakers.CreateEmail("blocked-user"),
                TestFakers.CreatePassword(),
                TestFakers.CreateDescription(),
                "{}"));
        var payload = await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);

        Assert.Contains(payload.Errors, error => error.Detail.Contains("maximum of 2 active users", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PutEdit_WhenCallerSetsIsActiveFalse_SoftDeletesUser()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [StandardRoleNames.User], workspaceName: "Operations");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/edit",
            new EditUserRequest(
                targetUserId,
                targetCredentials.UserName,
                TestFakers.CreateEmail(targetCredentials.UserName),
                TestFakers.CreateDescription(),
                false,
                "{\"language\":\"vi\"}"));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var updatedUser = await dbContext.Users.SingleAsync(user => user.Id == targetUserId);

        Assert.False(updatedUser.IsActive);
        Assert.Equal("{\"language\":\"vi\"}", updatedUser.UserSettings);
    }

    [Fact]
    public async Task PutEdit_WhenCallerTargetsDifferentWorkspace_ReturnsNotFound()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            targetCredentials.UserName,
            targetCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/edit",
            new EditUserRequest(
                targetUserId,
                targetCredentials.UserName,
                TestFakers.CreateEmail(targetCredentials.UserName),
                TestFakers.CreateDescription(),
                true,
                "{\"language\":\"en\"}"));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PutEdit_WhenReactivatingUserAtWorkspaceCapacity_ReturnsValidationProblem()
    {
        const string workspaceName = "Operations";
        var managerCredentials = TestFakers.CreateUserCredentials();
        var activeUserCredentials = TestFakers.CreateUserCredentials();
        var inactiveUserCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator],
            workspaceName: workspaceName);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            activeUserCredentials.UserName,
            activeUserCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: workspaceName);
        var inactiveUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            inactiveUserCredentials.UserName,
            inactiveUserCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: workspaceName,
            isActive: false);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Name == workspaceName);
            workspace.MaxActiveUsers = 2;
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/edit",
            new EditUserRequest(
                inactiveUserId,
                inactiveUserCredentials.UserName,
                TestFakers.CreateEmail(inactiveUserCredentials.UserName),
                TestFakers.CreateDescription(),
                true,
                "{\"language\":\"en\"}"));
        var payload = await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);

        Assert.Contains(payload.Errors, error => error.Detail.Contains("maximum of 2 active users", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PutEdit_WhenUserIsAlreadyActiveWhileWorkspaceIsOverCapacity_AllowsSave()
    {
        const string workspaceName = "Operations";
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator],
            workspaceName: workspaceName);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            targetCredentials.UserName,
            targetCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: workspaceName);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Name == workspaceName);
            workspace.MaxActiveUsers = 1;
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/edit",
            new EditUserRequest(
                targetUserId,
                targetCredentials.UserName,
                TestFakers.CreateEmail(targetCredentials.UserName),
                "Updated description",
                true,
                "{\"language\":\"vi\"}"));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);
    }

    [Fact]
    public async Task PutChangePassword_WhenAdministratorResetsPassword_RequiresPasswordChangeAgain()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();
        var resetPassword = TestFakers.CreateDifferentPassword(targetCredentials.Password);

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [StandardRoleNames.User], workspaceName: "Operations");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/changepassword",
            new ChangeUserPasswordRequest(targetUserId, resetPassword));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var oldPasswordClient = FirstPartyApiTestClient.CreateClient(_factory);
        var oldAccessToken = await FirstPartyApiTestClient.TryGetAccessTokenAsync(
            oldPasswordClient,
            targetCredentials.UserName,
            targetCredentials.Password);
        Assert.Null(oldAccessToken);

        using var newPasswordClient = FirstPartyApiTestClient.CreateClient(_factory);
        var newAccessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            newPasswordClient,
            targetCredentials.UserName,
            resetPassword);
        newPasswordClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", newAccessToken);

        var meResponse = await newPasswordClient.GetAsync("/api/auth/me");
        var mePayload = await ApiResponseReader.ReadSuccessDataAsync<AuthMeResponse>(meResponse);
        Assert.True(mePayload.RequirePasswordChange);
    }

    [Fact]
    public async Task PutChangePassword_WhenCallerTargetsDifferentWorkspace_ReturnsNotFound()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            targetCredentials.UserName,
            targetCredentials.Password,
            [StandardRoleNames.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/changepassword",
            new ChangeUserPasswordRequest(targetUserId, TestFakers.CreatePassword()));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PutChangeWorkspace_WhenCallerIsAdministrator_ReturnsForbidden()
    {
        var administratorCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [StandardRoleNames.User]);
        var targetWorkspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, TestFakers.CreateWorkspaceName());
        await TestIdentitySeeder.SeedUserAsync(_factory, administratorCredentials.UserName, administratorCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, administratorCredentials.UserName, administratorCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/change-workspace",
            new ChangeUserWorkspaceRequest(targetUserId, targetWorkspaceId));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task PutChangeWorkspace_WhenCallerIsSuperAdministrator_MovesUserToTargetWorkspace()
    {
        var targetCredentials = TestFakers.CreateUserCredentials();
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [StandardRoleNames.User]);
        var targetWorkspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/change-workspace",
            new ChangeUserWorkspaceRequest(targetUserId, targetWorkspaceId));

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var updatedUser = await dbContext.Users.SingleAsync(user => user.Id == targetUserId);

        Assert.Equal(targetWorkspaceId, updatedUser.WorkspaceId);
    }

    [Fact]
    public async Task PutChangeWorkspace_WhenTargetWorkspaceIsInactive_ReturnsValidationProblem()
    {
        var targetCredentials = TestFakers.CreateUserCredentials();
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [StandardRoleNames.User]);
        var targetWorkspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, TestFakers.CreateWorkspaceName(), isActive: false);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/change-workspace",
            new ChangeUserWorkspaceRequest(targetUserId, targetWorkspaceId));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);
    }
}

