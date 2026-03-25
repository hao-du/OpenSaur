using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Http;

public sealed class ApiResponseEnvelopeTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public ApiResponseEnvelopeTests(OpenSaurWebApplicationFactory factory)
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
    public async Task PostLogin_WhenCredentialsAreValid_ReturnsCommonSuccessEnvelope()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = credentials.UserName, Password = credentials.Password });
        var payload = await ReadEnvelopeAsync(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(payload.Success);
        AssertNullData(payload);
        Assert.Empty(payload.Errors);
    }

    [Fact]
    public async Task GetMe_WhenOidcAccessTokenIsValid_ReturnsPayloadInsideCommonSuccessEnvelope()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await response.Content.ReadFromJsonAsync<ApiEnvelope<AuthMeResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.True(payload.Success);
        Assert.NotNull(payload.Data);
        Assert.Empty(payload.Errors);
        Assert.Equal(credentials.UserName, payload.Data!.UserName);
        Assert.Contains(SystemRoles.Administrator, payload.Data.Roles);
    }

    [Fact]
    public async Task GetUsers_WhenCallerIsAnonymous_ReturnsCommonUnauthorizedEnvelope()
    {
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.GetAsync("/api/user/get");
        var payload = await ReadEnvelopeAsync(response);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.False(payload.Success);
        AssertNullData(payload);
        Assert.Single(payload.Errors);
        Assert.Equal("unauthorized", payload.Errors[0].Code);
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Message));
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Detail));
    }

    [Fact]
    public async Task GetUserById_WhenCallerTargetsDifferentWorkspace_ReturnsCommonNotFoundEnvelope()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var otherWorkspaceUserCredentials = TestFakers.CreateUserCredentials();

        await _factory.SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var otherWorkspaceUserId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [SystemRoles.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/user/getbyid/{otherWorkspaceUserId}");
        var payload = await ReadEnvelopeAsync(response);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.False(payload.Success);
        AssertNullData(payload);
        Assert.Single(payload.Errors);
        Assert.Equal("not_found", payload.Errors[0].Code);
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Message));
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Detail));
    }

    [Fact]
    public async Task PostCreateWorkspace_WhenRequestIsInvalid_ReturnsCommonValidationEnvelope()
    {
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new CreateWorkspaceRequest("   ", TestFakers.CreateDescription()));
        var payload = await ReadEnvelopeAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(payload.Success);
        AssertNullData(payload);
        Assert.NotEmpty(payload.Errors);
        Assert.All(payload.Errors, static error => Assert.Equal("validation_error", error.Code));
        Assert.All(payload.Errors, static error => Assert.False(string.IsNullOrWhiteSpace(error.Message)));
        Assert.All(payload.Errors, static error => Assert.False(string.IsNullOrWhiteSpace(error.Detail)));
    }

    [Fact]
    public async Task PostCreateWorkspace_WhenIdempotencyKeyIsReusedForDifferentPayload_ReturnsCommonConflictEnvelope()
    {
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        const string idempotencyKey = "workspace-envelope-conflict";

        var firstResponse = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new CreateWorkspaceRequest(TestFakers.CreateWorkspaceName(), TestFakers.CreateDescription()),
            idempotencyKey);

        var secondResponse = await FirstPartyApiTestClient.PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new CreateWorkspaceRequest(TestFakers.CreateWorkspaceName(), TestFakers.CreateDescription()),
            idempotencyKey);
        var payload = await ReadEnvelopeAsync(secondResponse);

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
        Assert.False(payload.Success);
        AssertNullData(payload);
        Assert.Single(payload.Errors);
        Assert.Equal("conflict", payload.Errors[0].Code);
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Message));
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Detail));
    }

    [Fact]
    public async Task PostLogin_WhenUnexpectedExceptionOccurs_ReturnsCommonServerErrorEnvelope()
    {
        using var failingFactory = new OpenSaurWebApplicationFactory(
            configureWebHost: builder =>
                builder.ConfigureServices(
                    services =>
                    {
                        services.RemoveAll<UserRepository>();
                        services.AddScoped<UserRepository, ThrowingUserRepository>();
                    }));
        using var client = FirstPartyApiTestClient.CreateClient(failingFactory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = "unexpected-user", Password = "Password1" });
        var payload = await ReadEnvelopeAsync(response);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.False(payload.Success);
        AssertNullData(payload);
        Assert.Single(payload.Errors);
        Assert.Equal("server_error", payload.Errors[0].Code);
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Message));
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Detail));
    }

    private static async Task<ApiEnvelope<JsonElement?>> ReadEnvelopeAsync(HttpResponseMessage response)
    {
        var payload = await response.Content.ReadFromJsonAsync<ApiEnvelope<JsonElement?>>();
        return payload ?? throw new InvalidOperationException("Response envelope was expected.");
    }

    private static void AssertNullData(ApiEnvelope<JsonElement?> payload)
    {
        Assert.True(payload.Data is null || payload.Data.Value.ValueKind == JsonValueKind.Null);
    }

    private sealed record ApiEnvelope<T>(bool Success, T? Data, ApiError[] Errors);

    private sealed record ApiError(string Code, string Message, string Detail);

    private sealed record CreateWorkspaceRequest(string Name, string? Description);

    private sealed record AuthMeResponse(string Id, string UserName, string[] Roles, bool RequirePasswordChange);

    private sealed class ThrowingUserRepository(ApplicationDbContext dbContext) : UserRepository(dbContext)
    {
        public override Task<Result<GetUserByUserNameResponse>> GetUserByUserNameAsync(
            GetUserByUserNameRequest request,
            CancellationToken cancellationToken)
        {
            throw new InvalidOperationException("Simulated user repository failure for envelope tests.");
        }
    }
}
