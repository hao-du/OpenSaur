using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Infrastructure;

public sealed class ApiResponseEnvelopeTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private const string ClientId = "first-party-web";
    private const string RedirectUri = "https://first-party.test.opensaur/auth/callback";
    private const string ClientSecret = "test-first-party-secret";

    private readonly OpenSaurWebApplicationFactory _factory;

    public ApiResponseEnvelopeTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await _factory.ResetDatabaseAsync();
        await _factory.SeedOidcClientAsync(ClientId, RedirectUri, ClientSecret);
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
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, credentials.Password));
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
        using var client = CreateClient();

        var accessToken = await GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
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
        using var client = CreateClient();

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
        var otherWorkspaceUserId = await SeedUserAsync(
            otherWorkspaceUserCredentials.UserName,
            otherWorkspaceUserCredentials.Password,
            [SystemRoles.User],
            workspaceName: TestFakers.CreateWorkspaceName());

        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
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
        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await PostAsJsonWithIdempotencyAsync(
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
        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        const string idempotencyKey = "workspace-envelope-conflict";

        var firstResponse = await PostAsJsonWithIdempotencyAsync(
            client,
            "/api/workspace/create",
            new CreateWorkspaceRequest(TestFakers.CreateWorkspaceName(), TestFakers.CreateDescription()),
            idempotencyKey);

        var secondResponse = await PostAsJsonWithIdempotencyAsync(
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
        using var client = CreateClient(failingFactory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("unexpected-user", "Password1"));
        var payload = await ReadEnvelopeAsync(response);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.False(payload.Success);
        AssertNullData(payload);
        Assert.Single(payload.Errors);
        Assert.Equal("server_error", payload.Errors[0].Code);
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Message));
        Assert.False(string.IsNullOrWhiteSpace(payload.Errors[0].Detail));
    }

    private HttpClient CreateClient()
    {
        return CreateClient(_factory);
    }

    private static HttpClient CreateClient(OpenSaurWebApplicationFactory factory)
    {
        return factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer),
                HandleCookies = true
            });
    }

    private async Task<string> GetAccessTokenAsync(HttpClient client, string userName, string password)
    {
        var accessToken = await TryGetAccessTokenAsync(client, userName, password);
        return accessToken ?? throw new InvalidOperationException("Access token was expected.");
    }

    private async Task<string?> TryGetAccessTokenAsync(HttpClient client, string userName, string password)
    {
        var authorizeResponse = await client.GetAsync(CreateAuthorizeUrl());
        var loginUri = authorizeResponse.Headers.Location ?? throw new InvalidOperationException("Hosted login redirect was expected.");
        var loginQuery = QueryHelpers.ParseQuery(loginUri.Query);
        var returnUrl = loginQuery["returnUrl"].ToString();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(userName, password));
        if (loginResponse.StatusCode != HttpStatusCode.OK)
        {
            return null;
        }

        var callbackResponse = await client.GetAsync(returnUrl);
        if (callbackResponse.StatusCode != HttpStatusCode.Redirect
            || callbackResponse.Headers.Location is null
            || !string.Equals(callbackResponse.Headers.Location.GetLeftPart(UriPartial.Path), RedirectUri, StringComparison.Ordinal))
        {
            return null;
        }

        var callbackQuery = QueryHelpers.ParseQuery(callbackResponse.Headers.Location.Query);
        var authorizationCode = callbackQuery["code"].ToString();
        if (string.IsNullOrWhiteSpace(authorizationCode))
        {
            return null;
        }

        var tokenResponse = await client.PostAsync(
            "/connect/token",
            new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("client_id", ClientId),
                new KeyValuePair<string, string>("client_secret", ClientSecret),
                new KeyValuePair<string, string>("redirect_uri", RedirectUri),
                new KeyValuePair<string, string>("code", authorizationCode)
            ]));

        if (tokenResponse.StatusCode != HttpStatusCode.OK)
        {
            return null;
        }

        await using var payloadStream = await tokenResponse.Content.ReadAsStreamAsync();
        using var payload = await JsonDocument.ParseAsync(payloadStream);

        return payload.RootElement.GetProperty("access_token").GetString();
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
            workspace = await dbContext.Workspaces.SingleAsync(
                workspaceEntity => workspaceEntity.Name == SystemWorkspaces.Personal);
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

    private static string CreateAuthorizeUrl()
    {
        return QueryHelpers.AddQueryString(
            "/connect/authorize",
            new Dictionary<string, string?>
            {
                ["client_id"] = ClientId,
                ["redirect_uri"] = RedirectUri,
                ["response_type"] = "code",
                ["scope"] = "openid profile email roles offline_access api",
                ["state"] = "first-party-state"
            });
    }

    private static Task<HttpResponseMessage> PostAsJsonWithIdempotencyAsync<TRequest>(
        HttpClient client,
        string requestUri,
        TRequest request,
        string? idempotencyKey = null)
    {
        client.DefaultRequestHeaders.Remove("Idempotency-Key");
        client.DefaultRequestHeaders.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));
        return client.PostAsJsonAsync(requestUri, request);
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

    private sealed record LoginRequest(string UserName, string Password);

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
