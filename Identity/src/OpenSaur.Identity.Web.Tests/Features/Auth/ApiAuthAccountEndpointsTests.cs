using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Features.Auth.ChangePassword;
using OpenSaur.Identity.Web.Features.Auth.Me;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.Auth;

public sealed class ApiAuthAccountEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public ApiAuthAccountEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task PostLogin_WhenCredentialsAreValid_EstablishesHostedSessionAndReturnsNoContent()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = credentials.UserName, Password = credentials.Password });

        await ApiResponseReader.AssertNullSuccessDataAsync(response);
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("s=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostLogin_WhenUserNameCasingDiffers_StillEstablishesHostedSession()
    {
        var userName = "CaseSensitiveUser";
        var password = TestFakers.CreatePassword();
        await TestIdentitySeeder.SeedUserAsync(_factory, userName, password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = userName.ToLowerInvariant(), Password = password });

        await ApiResponseReader.AssertNullSuccessDataAsync(response);
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("s=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task GetAuthorize_WhenUsingConfiguredFirstPartyClient_AnonymousBrowserIsRedirectedToLoginWithoutManualClientSeeding()
    {
        using var factory = new OpenSaurWebApplicationFactory();
        await factory.ResetDatabaseAsync();
        using var client = FirstPartyApiTestClient.CreateClient(factory);

        var response = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(
                FirstPartyApiTestClient.ClientId,
                FirstPartyApiTestClient.RedirectUri,
                "first-party-state"));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Equal("/login", response.Headers.Location!.AbsolutePath);
    }

    [Fact]
    public async Task PostLogin_WhenCredentialsAreInvalid_ReturnsUnauthorized()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new
            {
                UserName = credentials.UserName,
                Password = TestFakers.CreateDifferentPassword(credentials.Password)
            });

        var payload = await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Unauthorized);

        Assert.Single(payload.Errors);
        Assert.Equal("auth_invalid_credentials", payload.Errors[0].Code);
    }

    [Fact]
    public async Task PostLogin_WhenRequestShapeIsInvalid_ReturnsValidationEnvelope()
    {
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = string.Empty, Password = string.Empty });
        var payload = await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);

        Assert.All(payload.Errors, static error => Assert.Equal("validation_error", error.Code));
        Assert.All(payload.Errors, static error => Assert.False(string.IsNullOrWhiteSpace(error.Message)));
        Assert.All(payload.Errors, static error => Assert.False(string.IsNullOrWhiteSpace(error.Detail)));
    }

    [Fact]
    public async Task PostLogout_WhenHostedSessionExistsAndApiCallerIsAuthorized_ClearsSessionAndReturnsNoContent()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.PostAsync("/api/auth/logout", content: null);

        await ApiResponseReader.AssertNullSuccessDataAsync(response);
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("s=", StringComparison.Ordinal)
                     && value.Contains("expires=", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PostLogout_WhenApiCallerIsAnonymous_ReturnsUnauthorized()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = credentials.UserName, Password = credentials.Password });

        var response = await client.PostAsync("/api/auth/logout", content: null);

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_WhenOidcAccessTokenIsValid_ReturnsCurrentUserContext()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.Administrator]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<AuthMeResponse>(response);

        Assert.Equal(credentials.UserName, payload.UserName);
        Assert.Equal(credentials.Email, payload.Email);
        Assert.False(payload.RequirePasswordChange);
        Assert.Contains(StandardRoleNames.Administrator.ToUpperInvariant(), payload.Roles);
    }

    [Fact]
    public async Task GetDashboard_WhenCallerIsSuperAdministratorAtAllWorkspaces_ReturnsGlobalSummary()
    {
        await TestIdentitySeeder.SeedWorkspaceAsync(_factory, "Operations");
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "operations-admin",
            TestFakers.CreatePassword(),
            [StandardRoleNames.Administrator],
            workspaceName: "Operations");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/dashboard");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.Equal("global", payload.GetProperty("scope").GetString());
        Assert.True(payload.GetProperty("workspaceCount").GetInt32() >= 2);
        Assert.True(payload.GetProperty("activeUserCount").GetInt32() >= 2);
        Assert.True(payload.GetProperty("availableRoleCount").GetInt32() >= 1);
    }

    [Fact]
    public async Task GetDashboard_WhenCallerIsWorkspaceScoped_ReturnsWorkspaceSummaryIncludingCapacity()
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
            "inactive-operations-user",
            TestFakers.CreatePassword(),
            [StandardRoleNames.User],
            workspaceName: workspaceName,
            isActive: false);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var workspace = await dbContext.Workspaces.SingleAsync(candidate => candidate.Name == workspaceName);
            workspace.MaxActiveUsers = 10;
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/dashboard");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.Equal("workspace", payload.GetProperty("scope").GetString());
        Assert.Equal(workspaceName, payload.GetProperty("workspaceName").GetString());
        Assert.Equal(10, payload.GetProperty("maxActiveUsers").GetInt32());
        Assert.True(payload.GetProperty("activeUserCount").GetInt32() >= 1);
        Assert.True(payload.GetProperty("inactiveUserCount").GetInt32() >= 1);
    }

    [Fact]
    public async Task GetSettings_WhenCurrentUserHasPersistedPreferences_ReturnsStoredLocaleAndTimeZone()
    {
        var credentials = TestFakers.CreateUserCredentials();
        var userId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            credentials.UserName,
            credentials.Password,
            [StandardRoleNames.User]);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await dbContext.Users.SingleAsync(candidate => candidate.Id == userId);
            user.UserSettings = "{\"theme\":\"dark\",\"locale\":\"vi\",\"timeZone\":\"Asia/Saigon\"}";
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/settings");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.Equal("vi", payload.GetProperty("locale").GetString());
        Assert.Equal("Asia/Saigon", payload.GetProperty("timeZone").GetString());
    }

    [Fact]
    public async Task PutSettings_WhenValuesAreValid_PersistsMergedPreferencesAndKeepsUpdatedOnUtc()
    {
        var credentials = TestFakers.CreateUserCredentials();
        var userId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            credentials.UserName,
            credentials.Password,
            [StandardRoleNames.User]);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await dbContext.Users.SingleAsync(candidate => candidate.Id == userId);
            user.UserSettings = "{\"theme\":\"dark\"}";
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var requestStartedAtUtc = DateTime.UtcNow;

        var response = await client.PutAsJsonAsync(
            "/api/auth/settings",
            new
            {
                Locale = "vi",
                TimeZone = "Asia/Saigon"
            });
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.Equal("vi", payload.GetProperty("locale").GetString());
        Assert.Equal("Asia/Saigon", payload.GetProperty("timeZone").GetString());

        using var verificationScope = _factory.Services.CreateScope();
        var verificationDbContext = verificationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var updatedUser = await verificationDbContext.Users.SingleAsync(candidate => candidate.Id == userId);
        using var settingsDocument = JsonDocument.Parse(updatedUser.UserSettings);

        Assert.Equal("dark", settingsDocument.RootElement.GetProperty("theme").GetString());
        Assert.Equal("vi", settingsDocument.RootElement.GetProperty("locale").GetString());
        Assert.Equal("Asia/Saigon", settingsDocument.RootElement.GetProperty("timeZone").GetString());
        Assert.Equal(userId, updatedUser.UpdatedBy);
        Assert.NotNull(updatedUser.UpdatedOn);
        Assert.InRange(
            DateTime.SpecifyKind(updatedUser.UpdatedOn!.Value, DateTimeKind.Utc),
            requestStartedAtUtc.AddMinutes(-1),
            DateTime.UtcNow.AddMinutes(1));
    }

    [Fact]
    public async Task PutSettings_WhenValuesAreInvalid_ReturnsValidationEnvelope()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.PutAsJsonAsync(
            "/api/auth/settings",
            new
            {
                Locale = "fr",
                TimeZone = "Invalid/Timezone"
            });
        var payload = await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.BadRequest);

        Assert.All(payload.Errors, static error => Assert.Equal("validation_error", error.Code));
        Assert.Contains(payload.Errors, error => error.Detail.Contains("Locale", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(payload.Errors, error => error.Detail.Contains("time zone", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetMe_WhenSuperAdministratorRoleUsesSpacedNormalizedValue_ReturnsAllWorkspaces()
    {
        using var factory = new OpenSaurWebApplicationFactory();
        await FirstPartyApiTestClient.InitializeFactoryAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var superAdministratorRole = await dbContext.Roles.SingleAsync(
                role => role.NormalizedName != null
                        && role.NormalizedName.Replace(" ", string.Empty) == SystemRoles.NormalizedSuperAdministrator);

            superAdministratorRole.Name = "Super Administrator";
            superAdministratorRole.NormalizedName = "SUPER ADMINISTRATOR";
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<AuthMeResponse>(response);

        Assert.Equal("SystemAdministrator", payload.UserName);
        Assert.Equal("All workspaces", payload.WorkspaceName);
        Assert.Contains(payload.Roles, role => SystemRoles.IsSuperAdministratorValue(role));
    }

    [Fact]
    public async Task GetMe_WhenCallerIsSuperAdministratorAtAllWorkspaces_ReturnsCanManageUsersFalse()
    {
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.False(payload.GetProperty("canManageUsers").GetBoolean());
        Assert.Equal("All workspaces", payload.GetProperty("workspaceName").GetString());
    }

    [Fact]
    public async Task GetMe_WhenCallerCanManageOrgWorkspace_ReturnsCanManageUsersTrue()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            managerCredentials.UserName,
            managerCredentials.Password,
            [StandardRoleNames.Administrator],
            workspaceName: "Operations");

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            managerCredentials.UserName,
            managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.True(payload.GetProperty("canManageUsers").GetBoolean());
        Assert.Equal("Operations", payload.GetProperty("workspaceName").GetString());
    }

    [Fact]
    public async Task GetMe_WhenRoleIsNotAssignedToWorkspace_ExcludesRoleAndReturnsCanManageUsersFalse()
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
        await TestIdentitySeeder.SeedWorkspaceRoleAsync(_factory, workspaceId, administratorRoleId, isActive: false);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            managerCredentials.UserName,
            managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<AuthMeResponse>(response);

        Assert.DoesNotContain(payload.Roles, role => string.Equals(role, StandardRoleNames.Administrator.ToUpperInvariant(), StringComparison.Ordinal));
        Assert.False(payload.CanManageUsers);
    }

    [Fact]
    public async Task GetMe_WhenCallerIsAdministratorInPersonalWorkspace_ReturnsCanManageUsersFalse()
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

        var response = await client.GetAsync("/api/auth/me");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.False(payload.GetProperty("canManageUsers").GetBoolean());
        Assert.Equal("Personal", payload.GetProperty("workspaceName").GetString());
    }

    [Fact]
    public async Task PostChangePassword_WhenBootstrapAdministratorUsesOidcToken_RequiresReauthentication()
    {
        var newPassword = TestFakers.CreatePassword();
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var changePasswordResponse = await client.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest("Password1", newPassword));

        await ApiResponseReader.AssertNullSuccessDataAsync(changePasswordResponse);

        using var oldPasswordClient = FirstPartyApiTestClient.CreateClient(_factory);
        var oldPasswordAccessToken = await FirstPartyApiTestClient.TryGetAccessTokenAsync(
            oldPasswordClient,
            "SystemAdministrator",
            "Password1");

        Assert.Null(oldPasswordAccessToken);

        using var newPasswordClient = FirstPartyApiTestClient.CreateClient(_factory);
        var newPasswordAccessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            newPasswordClient,
            "SystemAdministrator",
            newPassword);
        newPasswordClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", newPasswordAccessToken);

        var meResponse = await newPasswordClient.GetAsync("/api/auth/me");
        var mePayload = await ApiResponseReader.ReadSuccessDataAsync<AuthMeResponse>(meResponse);

        Assert.False(mePayload.RequirePasswordChange);
    }

    [Fact]
    public async Task PostWebSessionExchange_WhenFirstPartyAuthorizationCodeIsValid_ReturnsAccessTokenAndRefreshCookie()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var authorizationCode = await OidcTestClient.AuthorizeAsync(
            client,
            FirstPartyApiTestClient.ClientId,
            FirstPartyApiTestClient.RedirectUri,
            credentials.UserName,
            credentials.Password);

        var response = await client.PostAsJsonAsync(
            "/api/auth/web-session/exchange",
            new { Code = authorizationCode });

        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("accessToken").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("expiresAt").GetString()));
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("r=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostWebSessionExchange_WhenUsingRealFirstPartyTokenClient_CompletesWithoutLoopbackHttp()
    {
        using var factory = new OpenSaurWebApplicationFactory(useTestFirstPartyOidcTokenClient: false);
        await FirstPartyApiTestClient.InitializeFactoryAsync(factory);

        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(factory);

        var authorizationCode = await OidcTestClient.AuthorizeAsync(
            client,
            FirstPartyApiTestClient.ClientId,
            FirstPartyApiTestClient.RedirectUri,
            credentials.UserName,
            credentials.Password);

        var response = await client.PostAsJsonAsync(
            "/api/auth/web-session/exchange",
            new { Code = authorizationCode });

        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("accessToken").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("expiresAt").GetString()));
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("r=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostWebSessionRefresh_WhenRefreshCookieIsValid_ReturnsReplacementAccessTokenAndRotatesRefreshCookie()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var authorizationCode = await OidcTestClient.AuthorizeAsync(
            client,
            FirstPartyApiTestClient.ClientId,
            FirstPartyApiTestClient.RedirectUri,
            credentials.UserName,
            credentials.Password);

        var exchangeResponse = await client.PostAsJsonAsync(
            "/api/auth/web-session/exchange",
            new { Code = authorizationCode });
        var initialRefreshCookie = exchangeResponse.Headers
            .GetValues("Set-Cookie")
            .Single(value => value.StartsWith("r=", StringComparison.Ordinal));

        var refreshResponse = await client.PostAsync("/api/auth/web-session/refresh", content: null);
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(refreshResponse);
        var rotatedRefreshCookie = refreshResponse.Headers
            .GetValues("Set-Cookie")
            .Single(value => value.StartsWith("r=", StringComparison.Ordinal));

        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("accessToken").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("expiresAt").GetString()));
        Assert.NotEqual(initialRefreshCookie, rotatedRefreshCookie);
    }

    [Fact]
    public async Task PostWebSessionRefresh_WhenUsingRealFirstPartyTokenClient_RotatesRefreshCookieWithoutLoopbackHttp()
    {
        using var factory = new OpenSaurWebApplicationFactory(useTestFirstPartyOidcTokenClient: false);
        await FirstPartyApiTestClient.InitializeFactoryAsync(factory);

        var credentials = TestFakers.CreateUserCredentials();
        await TestIdentitySeeder.SeedUserAsync(factory, credentials.UserName, credentials.Password, [StandardRoleNames.User]);
        using var client = FirstPartyApiTestClient.CreateClient(factory);

        var authorizationCode = await OidcTestClient.AuthorizeAsync(
            client,
            FirstPartyApiTestClient.ClientId,
            FirstPartyApiTestClient.RedirectUri,
            credentials.UserName,
            credentials.Password);

        var exchangeResponse = await client.PostAsJsonAsync(
            "/api/auth/web-session/exchange",
            new { Code = authorizationCode });
        var initialRefreshCookie = exchangeResponse.Headers
            .GetValues("Set-Cookie")
            .Single(value => value.StartsWith("r=", StringComparison.Ordinal));

        var refreshResponse = await client.PostAsync("/api/auth/web-session/refresh", content: null);
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(refreshResponse);
        var rotatedRefreshCookie = refreshResponse.Headers
            .GetValues("Set-Cookie")
            .Single(value => value.StartsWith("r=", StringComparison.Ordinal));

        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("accessToken").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(payload.GetProperty("expiresAt").GetString()));
        Assert.NotEqual(initialRefreshCookie, rotatedRefreshCookie);
    }

    [Fact]
    public async Task GetImpersonationOptions_WhenSuperAdministratorRequestsWorkspace_ReturnsWorkspaceUsersAndActiveSuperAdministrators()
    {
        using var factory = new OpenSaurWebApplicationFactory();
        await FirstPartyApiTestClient.InitializeFactoryAsync(factory);

        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(factory, "Finance");
        await TestIdentitySeeder.SeedUserAsync(
            factory,
            "FinanceAdmin",
            TestFakers.CreatePassword(),
            [StandardRoleNames.Administrator],
            workspaceName: "Finance");
        await TestIdentitySeeder.SeedUserAsync(
            factory,
            "FinanceSuperAdministrator",
            TestFakers.CreatePassword(),
            [SystemRoles.SuperAdministrator],
            workspaceName: "Finance");
        await TestIdentitySeeder.SeedUserAsync(
            factory,
            "GlobalSuperAdministrator",
            TestFakers.CreatePassword(),
            [SystemRoles.SuperAdministrator],
            workspaceName: "Leadership");
        await TestIdentitySeeder.SeedUserAsync(
            factory,
            "InactiveFinanceUser",
            TestFakers.CreatePassword(),
            [StandardRoleNames.User],
            workspaceName: "Finance",
            isActive: false);
        await TestIdentitySeeder.SeedUserAsync(
            factory,
            "InactiveSuperAdministrator",
            TestFakers.CreatePassword(),
            [SystemRoles.SuperAdministrator],
            workspaceName: "Leadership",
            isActive: false);
        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var superAdministratorRole = await dbContext.Roles.SingleAsync(
                role => role.NormalizedName != null
                        && role.NormalizedName.Replace(" ", string.Empty) == SystemRoles.NormalizedSuperAdministrator);

            superAdministratorRole.Name = "Platform Owner";
            superAdministratorRole.NormalizedName = "SUPER ADMINISTRATOR";
            await dbContext.SaveChangesAsync();
        }

        using var client = FirstPartyApiTestClient.CreateClient(factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/auth/impersonation/options/{workspaceId}");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);
        var users = payload.GetProperty("users").EnumerateArray().ToList();
        var userIds = users
            .Select(static user => user.GetProperty("id").GetGuid())
            .ToList();

        Assert.Equal("Finance", payload.GetProperty("workspaceName").GetString());
        Assert.Contains(users, user => user.GetProperty("userName").GetString() == "FinanceAdmin");
        Assert.Contains(users, user => user.GetProperty("userName").GetString() == "FinanceSuperAdministrator");
        Assert.Contains(users, user => user.GetProperty("userName").GetString() == "GlobalSuperAdministrator");
        Assert.Contains(users, user => user.GetProperty("userName").GetString() == "SystemAdministrator");
        Assert.DoesNotContain(users, user => user.GetProperty("userName").GetString() == "InactiveFinanceUser");
        Assert.DoesNotContain(users, user => user.GetProperty("userName").GetString() == "InactiveSuperAdministrator");
        Assert.Equal(userIds.Count, userIds.Distinct().Count());
    }

    [Fact]
    public async Task PostImpersonationStart_WhenSuperAdministratorTargetsWorkspaceUser_ReplacesCurrentUserContext()
    {
        var workspaceName = "Finance";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var userPassword = TestFakers.CreatePassword();
        var userId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceAdmin",
            userPassword,
            [StandardRoleNames.Administrator],
            workspaceName: workspaceName);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var superAdministratorAccessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            "SystemAdministrator",
            "Password1");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", superAdministratorAccessToken);

        var startResponse = await client.PostAsJsonAsync(
            "/api/auth/impersonation/start",
            new
            {
                WorkspaceId = workspaceId,
                UserId = userId
            });
        var startPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(startResponse);
        var impersonatedAccessToken = startPayload.GetProperty("accessToken").GetString();

        Assert.False(string.IsNullOrWhiteSpace(impersonatedAccessToken));
        Assert.Contains(
            startResponse.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("r=", StringComparison.Ordinal));

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", impersonatedAccessToken);

        var meResponse = await client.GetAsync("/api/auth/me");
        var mePayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(meResponse);

        Assert.Equal("FinanceAdmin", mePayload.GetProperty("userName").GetString());
        Assert.Equal(workspaceName, mePayload.GetProperty("workspaceName").GetString());
        Assert.True(mePayload.GetProperty("isImpersonating").GetBoolean());
        Assert.Contains(
            mePayload.GetProperty("roles").EnumerateArray().Select(static role => role.GetString()),
            role => role == StandardRoleNames.Administrator.ToUpperInvariant());
    }

    [Fact]
    public async Task PostImpersonationStart_WhenSuperAdministratorTargetsAnotherSuperAdministrator_UsesSelectedWorkspaceContext()
    {
        using var factory = new OpenSaurWebApplicationFactory();
        await FirstPartyApiTestClient.InitializeFactoryAsync(factory);

        var workspaceName = "Finance";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(factory, workspaceName);
        var superAdministratorId = await TestIdentitySeeder.SeedUserAsync(
            factory,
            "RegionalSuperAdministrator",
            TestFakers.CreatePassword(),
            [SystemRoles.SuperAdministrator],
            workspaceName: "Leadership");
        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var superAdministratorRole = await dbContext.Roles.SingleAsync(
                role => role.NormalizedName != null
                        && role.NormalizedName.Replace(" ", string.Empty) == SystemRoles.NormalizedSuperAdministrator);

            superAdministratorRole.Name = "Super Administrator";
            superAdministratorRole.NormalizedName = "SUPER ADMINISTRATOR";
            await dbContext.SaveChangesAsync();
        }
        using var client = FirstPartyApiTestClient.CreateClient(factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var startResponse = await client.PostAsJsonAsync(
            "/api/auth/impersonation/start",
            new
            {
                WorkspaceId = workspaceId,
                UserId = superAdministratorId
            });
        var startPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(startResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            startPayload.GetProperty("accessToken").GetString());

        var meResponse = await client.GetAsync("/api/auth/me");
        var mePayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(meResponse);

        Assert.Equal("RegionalSuperAdministrator", mePayload.GetProperty("userName").GetString());
        Assert.Equal(workspaceName, mePayload.GetProperty("workspaceName").GetString());
        Assert.True(mePayload.GetProperty("isImpersonating").GetBoolean());
        Assert.Contains(
            mePayload.GetProperty("roles").EnumerateArray().Select(static role => role.GetString()),
            role => SystemRoles.IsSuperAdministratorValue(role));
    }

    [Fact]
    public async Task PostImpersonationExit_WhenSessionIsImpersonating_RestoresSuperAdministrator()
    {
        var workspaceName = "Finance";
        var workspaceId = await TestIdentitySeeder.SeedWorkspaceAsync(_factory, workspaceName);
        var userId = await TestIdentitySeeder.SeedUserAsync(
            _factory,
            "FinanceAdmin",
            TestFakers.CreatePassword(),
            [StandardRoleNames.Administrator],
            workspaceName: workspaceName);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var superAdministratorAccessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            "SystemAdministrator",
            "Password1");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", superAdministratorAccessToken);

        var startResponse = await client.PostAsJsonAsync(
            "/api/auth/impersonation/start",
            new
            {
                WorkspaceId = workspaceId,
                UserId = userId
            });
        var impersonatedPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(startResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            impersonatedPayload.GetProperty("accessToken").GetString());

        var exitResponse = await client.PostAsync("/api/auth/impersonation/exit", content: null);
        var exitPayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(exitResponse);
        var restoredAccessToken = exitPayload.GetProperty("accessToken").GetString();

        Assert.False(string.IsNullOrWhiteSpace(restoredAccessToken));
        Assert.Contains(
            exitResponse.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("r=", StringComparison.Ordinal));

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", restoredAccessToken);

        var meResponse = await client.GetAsync("/api/auth/me");
        var mePayload = await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(meResponse);

        Assert.Equal("SystemAdministrator", mePayload.GetProperty("userName").GetString());
        Assert.Equal("All workspaces", mePayload.GetProperty("workspaceName").GetString());
        Assert.False(mePayload.GetProperty("isImpersonating").GetBoolean());
        Assert.Contains(
            mePayload.GetProperty("roles").EnumerateArray().Select(static role => role.GetString()),
            role => SystemRoles.IsSuperAdministratorValue(role));
    }
}

