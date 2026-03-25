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

namespace OpenSaur.Identity.Web.Tests.UserRoles;

public sealed class UserRoleEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public UserRoleEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetUserRoles_WhenCallerCanManageWorkspace_ReturnsOnlySameWorkspaceAssignments()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var sameWorkspaceUserCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var sameWorkspaceUserId = await SeedUserAsync(
            sameWorkspaceUserCredentials.UserName,
            sameWorkspaceUserCredentials.Password,
            []);
        var otherWorkspaceUserId = await SeedUserAsync(
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [],
            workspaceName: TestFakers.CreateWorkspaceName());
        var sameWorkspaceRoleId = await SeedRoleAsync(TestFakers.CreateRoleName());
        var otherWorkspaceRoleId = await SeedRoleAsync(TestFakers.CreateRoleName());

        await SeedUserRoleAsync(sameWorkspaceUserId, sameWorkspaceRoleId);
        await SeedUserRoleAsync(otherWorkspaceUserId, otherWorkspaceRoleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/user-role/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<UserRoleResponse>>(response);
        Assert.Contains(payload, assignment => assignment.UserId == sameWorkspaceUserId);
        Assert.DoesNotContain(payload, assignment => assignment.UserId == otherWorkspaceUserId);
    }

    [Fact]
    public async Task PostCreate_WhenCallerCanManageWorkspace_CreatesUserRoleAssignment()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, []);
        var roleId = await SeedRoleAsync(TestFakers.CreateRoleName());

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
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

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

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, []);
        var originalRoleId = await SeedRoleAsync(TestFakers.CreateRoleName());
        var replacementRoleId = await SeedRoleAsync(TestFakers.CreateRoleName());
        var assignmentId = await SeedUserRoleAsync(targetUserId, originalRoleId);

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

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(
            targetCredentials.UserName,
            targetCredentials.Password,
            [],
            workspaceName: TestFakers.CreateWorkspaceName());
        var roleId = await SeedRoleAsync(TestFakers.CreateRoleName());
        var assignmentId = await SeedUserRoleAsync(targetUserId, roleId);

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

    private async Task<Guid> SeedRoleAsync(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

        var existingRole = await roleManager.FindByNameAsync(name);
        if (existingRole is not null)
        {
            return existingRole.Id;
        }

        var role = new ApplicationRole
        {
            Name = name,
            Description = TestFakers.CreateDescription(),
            IsActive = true,
            CreatedBy = Guid.CreateVersion7()
        };

        var createResult = await roleManager.CreateAsync(role);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", createResult.Errors.Select(error => error.Description)));
        }

        return role.Id;
    }

    private async Task<Guid> SeedUserRoleAsync(Guid userId, Guid roleId, bool isActive = true)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var assignment = new ApplicationUserRole
        {
            UserId = userId,
            RoleId = roleId,
            Description = TestFakers.CreateDescription(),
            IsActive = isActive,
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };

        dbContext.UserRoles.Add(assignment);
        await dbContext.SaveChangesAsync();

        return assignment.Id;
    }

    private sealed record CreateUserRoleRequest(Guid UserId, Guid RoleId, string Description);

    private sealed record EditUserRoleRequest(Guid Id, Guid RoleId, string Description, bool IsActive);

    private sealed record UserRoleResponse(
        Guid Id,
        Guid UserId,
        string UserName,
        Guid RoleId,
        string RoleName,
        string Description,
        bool IsActive);
}
