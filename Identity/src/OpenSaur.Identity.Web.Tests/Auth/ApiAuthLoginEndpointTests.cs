using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Auth;

public sealed class ApiAuthLoginEndpointTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public ApiAuthLoginEndpointTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync()
    {
        return _factory.ResetDatabaseAsync();
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task PostLogin_WhenCredentialsAreValid_ReturnsAccessTokenAndRefreshCookie()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, credentials.Password));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload.AccessToken));
        Assert.Equal(credentials.UserName, payload.User.UserName);
        Assert.False(payload.User.RequirePasswordChange);
        Assert.Contains(SystemRoles.Administrator, payload.User.Roles);
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("opensaur.identity.refresh=", StringComparison.Ordinal));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload.AccessToken);

        var meResponse = await client.GetAsync("/api/auth/me");
        var mePayload = await meResponse.Content.ReadFromJsonAsync<AuthMeResponse>();

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        Assert.NotNull(mePayload);
        Assert.Equal(payload.User.Id, mePayload.Id);
        Assert.Equal(payload.User.UserName, mePayload.UserName);
        Assert.False(mePayload.RequirePasswordChange);
        Assert.Contains(SystemRoles.Administrator, mePayload.Roles);
    }

    [Fact]
    public async Task PostLogin_WhenPasswordIsInvalid_ReturnsUnauthorized()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.User]);
        var invalidPassword = TestFakers.CreateDifferentPassword(credentials.Password);
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, invalidPassword));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostRefresh_WhenRefreshCookieIsValid_ReturnsNewAccessToken()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = CreateClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, credentials.Password));
        var loginPayload = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        var refreshResponse = await client.PostAsync("/api/auth/refresh", content: null);

        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);

        var refreshPayload = await refreshResponse.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(loginPayload);
        Assert.NotNull(refreshPayload);
        Assert.NotEqual(loginPayload.AccessToken, refreshPayload.AccessToken);
        Assert.Contains(
            refreshResponse.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("opensaur.identity.refresh=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostLogin_WhenCredentialsAreValid_AccessTokenUsesSubjectClaimWithoutLegacyNameIdentifier()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, credentials.Password));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(payload);

        var token = new JwtSecurityTokenHandler().ReadJwtToken(payload.AccessToken);

        Assert.Contains(
            token.Claims,
            claim => claim.Type == ApplicationClaimTypes.Subject && claim.Value == payload.User.Id);
        Assert.DoesNotContain(
            token.Claims,
            claim => (claim.Type == ApplicationClaimTypes.NameIdentifier || claim.Type == "nameid")
                     && claim.Value == payload.User.Id);
        Assert.Contains(
            token.Claims,
            claim => claim.Type == ApplicationClaimTypes.Name && claim.Value == payload.User.UserName);
        Assert.Contains(
            token.Claims,
            claim => claim.Type == ApplicationClaimTypes.Role && claim.Value == SystemRoles.Administrator);
    }

    [Fact]
    public async Task PostRefresh_WhenPriorRefreshCookieIsReusedAfterRotation_ReturnsUnauthorized()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = CreateClient(handleCookies: false);

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, credentials.Password));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var originalRefreshCookie = ExtractRefreshCookie(loginResponse);

        using var firstRefreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        firstRefreshRequest.Headers.Add("Cookie", originalRefreshCookie);

        var firstRefreshResponse = await client.SendAsync(firstRefreshRequest);

        Assert.Equal(HttpStatusCode.OK, firstRefreshResponse.StatusCode);

        var rotatedRefreshCookie = ExtractRefreshCookie(firstRefreshResponse);

        using var replayRefreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        replayRefreshRequest.Headers.Add("Cookie", originalRefreshCookie);

        var replayRefreshResponse = await client.SendAsync(replayRefreshRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, replayRefreshResponse.StatusCode);

        using var rotatedRefreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        rotatedRefreshRequest.Headers.Add("Cookie", rotatedRefreshCookie);

        var rotatedRefreshResponse = await client.SendAsync(rotatedRefreshRequest);

        Assert.Equal(HttpStatusCode.OK, rotatedRefreshResponse.StatusCode);
    }

    [Fact]
    public async Task PostLogout_WhenAnonymousButRefreshCookieExists_ClearsRefreshSession()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = CreateClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, credentials.Password));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var logoutResponse = await client.PostAsync("/api/auth/logout", content: null);

        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);
        Assert.Contains(
            logoutResponse.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("opensaur.identity.refresh=", StringComparison.Ordinal)
                     && value.Contains("expires=", StringComparison.OrdinalIgnoreCase));

        var refreshResponse = await client.PostAsync("/api/auth/refresh", content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task PostLogin_WhenBootstrapAdministratorLogsIn_RequiresPasswordChange()
    {
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("SystemAdministrator", "Password1"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(payload);
        Assert.True(payload.User.RequirePasswordChange);
    }

    [Fact]
    public async Task PostChangePassword_WhenCurrentPasswordIsValid_ClearsPasswordChangeRequirement()
    {
        var newPassword = TestFakers.CreatePassword();
        using var client = CreateClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("SystemAdministrator", "Password1"));
        var loginPayload = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.NotNull(loginPayload);
        Assert.True(loginPayload.User.RequirePasswordChange);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload.AccessToken);

        var changePasswordResponse = await client.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest("Password1", newPassword));

        Assert.Equal(HttpStatusCode.OK, changePasswordResponse.StatusCode);

        var changePasswordPayload = await changePasswordResponse.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(changePasswordPayload);
        Assert.False(changePasswordPayload.User.RequirePasswordChange);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", changePasswordPayload.AccessToken);

        var meResponse = await client.GetAsync("/api/auth/me");
        var mePayload = await meResponse.Content.ReadFromJsonAsync<AuthMeResponse>();

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        Assert.NotNull(mePayload);
        Assert.False(mePayload.RequirePasswordChange);

        using var reloginClient = CreateClient();

        var oldPasswordResponse = await reloginClient.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("SystemAdministrator", "Password1"));
        var newPasswordResponse = await reloginClient.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("SystemAdministrator", newPassword));
        var newPasswordPayload = await newPasswordResponse.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.Equal(HttpStatusCode.Unauthorized, oldPasswordResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, newPasswordResponse.StatusCode);
        Assert.NotNull(newPasswordPayload);
        Assert.False(newPasswordPayload.User.RequirePasswordChange);
    }

    [Fact]
    public async Task GetMe_WhenRequestedOverHttp_RedirectsToHttps()
    {
        using var client = CreateClient(baseAddress: new Uri("http://identity.test.opensaur"), allowAutoRedirect: false);

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.TemporaryRedirect, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Equal(Uri.UriSchemeHttps, response.Headers.Location!.Scheme);
    }

    private HttpClient CreateClient(
        bool handleCookies = true,
        bool allowAutoRedirect = true,
        Uri? baseAddress = null)
    {
        return _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = allowAutoRedirect,
                BaseAddress = baseAddress ?? new Uri(OpenSaurWebApplicationFactory.Issuer),
                HandleCookies = handleCookies
            });
    }

    private static string ExtractRefreshCookie(HttpResponseMessage response)
    {
        var refreshCookie = response.Headers
            .GetValues("Set-Cookie")
            .Single(value => value.StartsWith("opensaur.identity.refresh=", StringComparison.Ordinal));

        return refreshCookie.Split(';', 2)[0];
    }

    private sealed record LoginRequest(string UserName, string Password);

    private sealed record AuthResponse(
        string AccessToken,
        DateTime ExpiresAtUtc,
        AuthUser User);

    private sealed record AuthUser(
        string Id,
        string UserName,
        string[] Roles,
        bool RequirePasswordChange);

    private sealed record ChangePasswordRequest(
        string CurrentPassword,
        string NewPassword);

    private sealed record AuthMeResponse(
        string Id,
        string UserName,
        string[] Roles,
        bool RequirePasswordChange);
}
