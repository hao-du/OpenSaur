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

namespace OpenSaur.Identity.Web.Tests.Workspaces;

public sealed class WorkspaceEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public WorkspaceEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetWorkspaces_WhenCallerIsAdministrator_ReturnsOnlyCurrentWorkspace()
    {
        var administratorCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(administratorCredentials.UserName, administratorCredentials.Password, [SystemRoles.Administrator]);
        var otherWorkspaceId = await SeedWorkspaceAsync(TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, administratorCredentials.UserName, administratorCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/workspace/get");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<IReadOnlyList<WorkspaceResponse>>(response);
        Assert.Single(payload);
        Assert.DoesNotContain(payload, workspace => workspace.Id == otherWorkspaceId);
    }

    [Fact]
    public async Task GetWorkspaceById_WhenAdministratorTargetsDifferentWorkspace_ReturnsNotFound()
    {
        var administratorCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(administratorCredentials.UserName, administratorCredentials.Password, [SystemRoles.Administrator]);
        var otherWorkspaceId = await SeedWorkspaceAsync(TestFakers.CreateWorkspaceName());

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
        await SeedUserAsync(administratorCredentials.UserName, administratorCredentials.Password, [SystemRoles.Administrator]);

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
    public async Task PutEdit_WhenCallerIsSuperAdministrator_UpdatesWorkspaceAndCanDeactivateIt()
    {
        var workspaceId = await SeedWorkspaceAsync(TestFakers.CreateWorkspaceName());

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

    private async Task<Guid> SeedUserAsync(
        string userName,
        string password,
        IEnumerable<string> roles)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var workspace = await dbContext.Workspaces.SingleAsync(workspaceEntity => workspaceEntity.Name == SystemWorkspaces.Personal);
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

    private sealed record CreateWorkspaceRequest(string Name, string Description);

    private sealed record EditWorkspaceRequest(Guid Id, string Name, string Description, bool IsActive);

    private sealed record WorkspaceResponse(Guid Id, string Name, string Description, bool IsActive);
}
