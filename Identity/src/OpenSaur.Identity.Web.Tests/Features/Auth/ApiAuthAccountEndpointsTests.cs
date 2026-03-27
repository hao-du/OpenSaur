using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using OpenSaur.Identity.Web.Features.Auth.ChangePassword;
using OpenSaur.Identity.Web.Features.Auth.Me;
using OpenSaur.Identity.Web.Domain.Identity;
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
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, userName, password, [SystemRoles.User]);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new
            {
                UserName = credentials.UserName,
                Password = TestFakers.CreateDifferentPassword(credentials.Password)
            });

        await ApiResponseReader.ReadFailureEnvelopeAsync(response, HttpStatusCode.Unauthorized);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await ApiResponseReader.ReadSuccessDataAsync<AuthMeResponse>(response);

        Assert.Equal(credentials.UserName, payload.UserName);
        Assert.False(payload.RequirePasswordChange);
        Assert.Contains(SystemRoles.Administrator, payload.Roles);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
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
        await TestIdentitySeeder.SeedUserAsync(factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
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
        await TestIdentitySeeder.SeedUserAsync(factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
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
}
