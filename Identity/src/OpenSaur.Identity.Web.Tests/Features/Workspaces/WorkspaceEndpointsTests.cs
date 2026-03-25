using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
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
        await TestIdentitySeeder.SeedUserAsync(_factory, administratorCredentials.UserName, administratorCredentials.Password, [SystemRoles.Administrator]);
        var otherWorkspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, TestFakers.CreateWorkspaceName());

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
        await TestIdentitySeeder.SeedUserAsync(_factory, administratorCredentials.UserName, administratorCredentials.Password, [SystemRoles.Administrator]);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, administratorCredentials.UserName, administratorCredentials.Password, [SystemRoles.Administrator]);

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

    private sealed record CreateWorkspaceRequest(string Name, string Description);

    private sealed record EditWorkspaceRequest(Guid Id, string Name, string Description, bool IsActive);

    private sealed record WorkspaceResponse(Guid Id, string Name, string Description, bool IsActive);
}
