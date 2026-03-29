using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole;
using OpenSaur.Identity.Web.Features.UserRoles.EditUserRole;
using OpenSaur.Identity.Web.Features.UserRoles.GetAssignmentCandidates;
using OpenSaur.Identity.Web.Features.UserRoles.GetRoleCandidates;
using OpenSaur.Identity.Web.Features.UserRoles.GetRoleAssignments;
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

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");
        var sameWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            sameWorkspaceUserCredentials.UserName,
            sameWorkspaceUserCredentials.Password,
            [],
            workspaceName: "Operations");
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
    public async Task GetRoleAssignments_WhenCallerIsImpersonatedSuperAdministrator_ReturnsOnlyAssignmentsInImpersonatedWorkspace()
    {
        const string workspaceName = "Finance";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var otherWorkspaceName = TestFakers.CreateWorkspaceName();
        await TestIdentitySeeder.SeedWorkspaceAsync(_factory, otherWorkspaceName);

        var impersonatedSuperAdministratorId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceSuperAdministrator",
            TestFakers.CreatePassword(),
            [SystemRoles.SuperAdministrator],
            workspaceName: workspaceName);
        var financeUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceManager",
            TestFakers.CreatePassword(),
            [],
            workspaceName: workspaceName);
        var outsideWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "OtherWorkspaceManager",
            TestFakers.CreatePassword(),
            [],
            workspaceName: otherWorkspaceName);
        var roleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        var financeAssignmentId = await TestIdentitySeeder.SeedUserRoleAsync(_factory, financeUserId, roleId);
        await TestIdentitySeeder.SeedUserRoleAsync(_factory, outsideWorkspaceUserId, roleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var superAdministratorAccessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            "SystemAdministrator",
            "Password1");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", superAdministratorAccessToken);

        var impersonationResponse = await client.PostAsJsonAsync(
            "/api/auth/impersonation/start",
            new
            {
                WorkspaceId = workspaceId,
                UserId = impersonatedSuperAdministratorId
            });
        var impersonationPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(impersonationResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            impersonationPayload.GetProperty("accessToken").GetString());

        var response = await client.GetAsync($"/api/user-role/getbyrole/{roleId}");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetRoleAssignmentsResponse>>(response);

        Assert.Single(payload);
        Assert.Equal(financeAssignmentId, payload[0].Id);
        Assert.Equal(financeUserId, payload[0].UserId);
        Assert.Equal(workspaceId, payload[0].WorkspaceId);
        Assert.Equal(workspaceName, payload[0].WorkspaceName);
        Assert.DoesNotContain(payload, assignment => assignment.UserId == outsideWorkspaceUserId);
    }

    [Fact]
    public async Task GetAvailableRoles_WhenCallerIsImpersonatedSuperAdministrator_ReturnsOnlyWorkspaceAvailableRoles()
    {
        const string workspaceName = "Finance";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var impersonatedSuperAdministratorId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceSuperAdministrator",
            TestFakers.CreatePassword(),
            [SystemRoles.SuperAdministrator],
            workspaceName: workspaceName);
        var administratorRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, StandardRoleNames.Administrator);
        var availableRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Content Writer");
        var excludedRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Task Manager");
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, administratorRoleId);
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, availableRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var superAdministratorAccessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            "SystemAdministrator",
            "Password1");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", superAdministratorAccessToken);

        var impersonationResponse = await client.PostAsJsonAsync(
            "/api/auth/impersonation/start",
            new
            {
                WorkspaceId = workspaceId,
                UserId = impersonatedSuperAdministratorId
            });
        var impersonationPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(impersonationResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            impersonationPayload.GetProperty("accessToken").GetString());

        var response = await client.GetAsync("/api/user-role/getavailableroles");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);
        var roleIds = payload.EnumerateArray()
            .Select(static role => role.GetProperty("id").GetGuid())
            .ToList();

        Assert.Contains(administratorRoleId, roleIds);
        Assert.Contains(availableRoleId, roleIds);
        Assert.DoesNotContain(excludedRoleId, roleIds);
    }

    [Fact]
    public async Task GetAssignmentCandidates_WhenCallerIsSuperAdministrator_ReturnsActiveUsersAcrossWorkspaces()
    {
        const string workspaceName = "Finance";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var activeUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceUser",
            TestFakers.CreatePassword(),
            [],
            workspaceName: workspaceName);
        var otherWorkspaceName = TestFakers.CreateWorkspaceName();
        var otherWorkspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, otherWorkspaceName);
        var otherActiveUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "OtherWorkspaceUser",
            TestFakers.CreatePassword(),
            [],
            workspaceName: otherWorkspaceName);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "InactiveFinanceUser",
            TestFakers.CreatePassword(),
            [],
            workspaceName: workspaceName,
            isActive: false);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user-role/getcandidates");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetAssignmentCandidatesResponse>>(response);

        Assert.Contains(payload, candidate => candidate.UserId == activeUserId && candidate.WorkspaceId == workspaceId);
        Assert.Contains(payload, candidate => candidate.UserId == otherActiveUserId && candidate.WorkspaceId == otherWorkspaceId);
        Assert.DoesNotContain(payload, candidate => candidate.UserName == "InactiveFinanceUser");
    }

    [Fact]
    public async Task GetAssignmentCandidates_WhenCallerIsImpersonatedSuperAdministrator_ReturnsOnlyActiveUsersInImpersonatedWorkspace()
    {
        const string workspaceName = "Finance";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var impersonatedUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceSuperAdministrator",
            TestFakers.CreatePassword(),
            [SystemRoles.SuperAdministrator],
            workspaceName: workspaceName);
        var activeWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceUser",
            TestFakers.CreatePassword(),
            [],
            workspaceName: workspaceName);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "InactiveFinanceUser",
            TestFakers.CreatePassword(),
            [],
            workspaceName: workspaceName,
            isActive: false);
        var otherWorkspaceName = TestFakers.CreateWorkspaceName();
        await TestIdentitySeeder.SeedWorkspaceAsync(_factory, otherWorkspaceName);
        var outsideWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "OtherWorkspaceUser",
            TestFakers.CreatePassword(),
            [],
            workspaceName: otherWorkspaceName);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var superAdministratorAccessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            "SystemAdministrator",
            "Password1");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", superAdministratorAccessToken);

        var impersonationResponse = await client.PostAsJsonAsync(
            "/api/auth/impersonation/start",
            new
            {
                WorkspaceId = workspaceId,
                UserId = impersonatedUserId
            });
        var impersonationPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(impersonationResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            impersonationPayload.GetProperty("accessToken").GetString());

        var response = await client.GetAsync("/api/user-role/getcandidates");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetAssignmentCandidatesResponse>>(response);

        Assert.Contains(payload, candidate => candidate.UserId == activeWorkspaceUserId);
        Assert.Contains(payload, candidate => candidate.UserId == impersonatedUserId);
        Assert.All(payload, candidate =>
        {
            Assert.Equal(workspaceId, candidate.WorkspaceId);
            Assert.Equal(workspaceName, candidate.WorkspaceName);
        });
        Assert.DoesNotContain(payload, candidate => candidate.UserId == outsideWorkspaceUserId);
        Assert.DoesNotContain(payload, candidate => candidate.UserName == "InactiveFinanceUser");
    }

    [Fact]
    public async Task GetUserAssignments_WhenCallerCanManageWorkspace_ReturnsAssignmentsForManagedUser()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: workspaceName);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [], workspaceName: workspaceName);
        var otherWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [],
            workspaceName: "Finance");
        var assignedRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "OperationsManager");
        var otherRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "FinanceManager");
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, assignedRoleId);
        var targetAssignmentId = await TestIdentitySeeder.SeedUserRoleAsync(_factory, targetUserId, assignedRoleId);
        await TestIdentitySeeder.SeedUserRoleAsync(_factory, otherWorkspaceUserId, otherRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/user-role/getbyuser/{targetUserId}");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.Equal(JsonValueKind.Array, payload.ValueKind);
        Assert.Equal(1, payload.GetArrayLength());
        Assert.Equal(targetAssignmentId, payload[0].GetProperty("id").GetGuid());
        Assert.Equal(targetUserId, payload[0].GetProperty("userId").GetGuid());
        Assert.Equal(assignedRoleId, payload[0].GetProperty("roleId").GetGuid());
    }

    [Fact]
    public async Task GetUserAssignments_WhenCallerIsSuperAdministratorAtAllWorkspaces_ReturnsForbidden()
    {
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, "TargetUser", TestFakers.CreatePassword(), []);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/user-role/getbyuser/{targetUserId}");

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetRoleCandidates_WhenCallerIsAdministratorInPersonalWorkspace_ReturnsForbidden()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user-role/getrolecandidates");

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetRoleCandidates_WhenCallerCanManageWorkspace_ExcludesSuperAdministratorRole()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator],
            workspaceName: "Operations");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user-role/getrolecandidates");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetRoleCandidatesResponse>>(response);

        Assert.NotEmpty(payload);
        Assert.DoesNotContain(payload, role => SystemRoles.IsSuperAdministratorValue(role.RoleNormalizedName));
    }

    [Fact]
    public async Task GetRoleCandidates_WhenWorkspaceHasAssignedRoles_ReturnsOnlyWorkspaceAvailableRoles()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator],
            workspaceName: workspaceName);
        var administratorRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, StandardRoleNames.Administrator);
        var availableRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Content Writer");
        var excludedRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Task Manager");
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, administratorRoleId);
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, availableRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user-role/getrolecandidates");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<GetRoleCandidatesResponse>>(response);

        Assert.Contains(payload, role => role.RoleId == availableRoleId);
        Assert.Contains(payload, role => role.RoleId == administratorRoleId);
        Assert.DoesNotContain(payload, role => role.RoleId == excludedRoleId);
    }

    [Fact]
    public async Task PostCreate_WhenCallerCanManageWorkspace_CreatesUserRoleAssignment()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: workspaceName);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [], workspaceName: workspaceName);
        var roleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, roleId);

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
    public async Task PostCreate_WhenRoleIsNotAssignedToWorkspace_ReturnsValidationError()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();
        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);

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
        var administratorRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, StandardRoleNames.Administrator);
        var unavailableRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, "Task Manager");
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, administratorRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/user-role/create",
            new CreateUserRoleRequest(targetUserId, unavailableRoleId, TestFakers.CreateDescription()));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostCreate_WhenRequestShapeIsInvalid_ReturnsValidationEnvelope()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: "Operations");

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

        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: workspaceName);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [], workspaceName: workspaceName);
        var originalRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        var replacementRoleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, originalRoleId);
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, replacementRoleId);
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

        const string workspaceName = "Operations";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [StandardRoleNames.Administrator], workspaceName: workspaceName);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            targetCredentials.UserName,
            targetCredentials.Password,
            [],
            workspaceName: TestFakers.CreateWorkspaceName());
        var roleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, roleId);
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

