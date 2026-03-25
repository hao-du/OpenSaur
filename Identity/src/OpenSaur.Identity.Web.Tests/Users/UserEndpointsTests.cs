using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Users;

public sealed class UserEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public UserEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetUsers_WhenCallerCanManageWorkspace_ReturnsOnlySameWorkspaceUsers()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var sameWorkspaceUserCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        await SeedUserAsync(sameWorkspaceUserCredentials.UserName, sameWorkspaceUserCredentials.Password, [SystemRoles.User]);
        await SeedUserAsync(
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [SystemRoles.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<UserSummaryResponse>>(response);
        Assert.Contains(payload, user => user.UserName == sameWorkspaceUserCredentials.UserName);
        Assert.DoesNotContain(payload, user => user.UserName == otherWorkspaceUserCredentials.UserName);
    }

    [Fact]
    public async Task GetUserById_WhenCallerTargetsDifferentWorkspace_ReturnsNotFound()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var otherWorkspaceUserId = await SeedUserAsync(
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [SystemRoles.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/user/getbyid/{otherWorkspaceUserId}");
        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetUserById_WhenCallerIsSuperAdministrator_AllowsCrossWorkspaceAccess()
    {
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserId = await SeedUserAsync(
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [SystemRoles.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/user/getbyid/{otherWorkspaceUserId}");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<UserDetailResponse>(response);
        Assert.Equal(otherWorkspaceUserId, payload.Id);
    }

    [Fact]
    public async Task PostCreate_WhenCallerCanManageWorkspace_CreatesUserInOwnWorkspace()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var newUserCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

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
    public async Task PutEdit_WhenCallerSetsIsActiveFalse_SoftDeletesUser()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, [SystemRoles.User]);

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

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(
            targetCredentials.UserName,
            targetCredentials.Password,
            [SystemRoles.User],
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
    public async Task PutChangePassword_WhenAdministratorResetsPassword_RequiresPasswordChangeAgain()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();
        var resetPassword = TestFakers.CreateDifferentPassword(targetCredentials.Password);

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, [SystemRoles.User]);

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

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(
            targetCredentials.UserName,
            targetCredentials.Password,
            [SystemRoles.User],
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
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, [SystemRoles.User]);
        var targetWorkspaceId = await SeedWorkspaceAsync(TestFakers.CreateWorkspaceName());
        await SeedUserAsync(administratorCredentials.UserName, administratorCredentials.Password, [SystemRoles.Administrator]);

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
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, [SystemRoles.User]);
        var targetWorkspaceId = await SeedWorkspaceAsync(TestFakers.CreateWorkspaceName());

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
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, [SystemRoles.User]);
        var targetWorkspaceId = await SeedWorkspaceAsync(TestFakers.CreateWorkspaceName(), isActive: false);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PutAsJsonWithIdempotencyAsync(
            client,
            "/api/user/change-workspace",
            new ChangeUserWorkspaceRequest(targetUserId, targetWorkspaceId));

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);
    }

    private async Task<Guid> SeedUserAsync(
        string userName,
        string password,
        IEnumerable<string> roles,
        string? workspaceName = null)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        Workspace workspace;
        if (string.IsNullOrWhiteSpace(workspaceName))
        {
            workspace = await dbContext.Workspaces.SingleAsync(workspaceEntity => workspaceEntity.Name == SystemWorkspaces.Personal);
        }
        else
        {
            workspace = new Workspace
            {
                Name = workspaceName,
                Description = TestFakers.CreateDescription(),
                CreatedBy = Guid.CreateVersion7()
            };

            dbContext.Workspaces.Add(workspace);
            await dbContext.SaveChangesAsync();
        }

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

    private async Task<Guid> SeedWorkspaceAsync(string workspaceName, bool isActive = true)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var workspace = new Workspace
        {
            Name = workspaceName,
            Description = TestFakers.CreateDescription(),
            IsActive = isActive,
            CreatedBy = Guid.CreateVersion7()
        };

        dbContext.Workspaces.Add(workspace);
        await dbContext.SaveChangesAsync();

        return workspace.Id;
    }

    private sealed record CreateUserRequest(
        string UserName,
        string Email,
        string Password,
        string Description,
        string UserSettings);

    private sealed record EditUserRequest(
        Guid Id,
        string UserName,
        string Email,
        string Description,
        bool IsActive,
        string UserSettings);

    private sealed record ChangeUserPasswordRequest(Guid UserId, string NewPassword);

    private sealed record ChangeUserWorkspaceRequest(Guid UserId, Guid WorkspaceId);

    private sealed record UserSummaryResponse(Guid Id, string UserName, Guid WorkspaceId, bool IsActive);

    private sealed record UserDetailResponse(Guid Id, string UserName, Guid WorkspaceId, bool IsActive);

    private sealed record AuthMeResponse(string Id, string UserName, string[] Roles, bool RequirePasswordChange);

}
