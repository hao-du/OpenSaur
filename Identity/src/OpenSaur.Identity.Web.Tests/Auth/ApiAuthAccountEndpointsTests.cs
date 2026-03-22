using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.WebUtilities;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Auth;

public sealed class ApiAuthAccountEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private const string ClientId = "first-party-web";
    private const string RedirectUri = "https://first-party.test.opensaur/auth/callback";
    private const string ClientSecret = "test-first-party-secret";

    private readonly OpenSaurWebApplicationFactory _factory;

    public ApiAuthAccountEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task PostLogin_WhenCredentialsAreValid_EstablishesHostedSessionAndReturnsNoContent()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, credentials.Password));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("opensaur.identity.session=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostLogin_WhenCredentialsAreInvalid_ReturnsUnauthorized()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(credentials.UserName, TestFakers.CreateDifferentPassword(credentials.Password)));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostLogout_WhenHostedSessionExistsAndApiCallerIsAuthorized_ClearsSessionAndReturnsNoContent()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.PostAsync("/api/auth/logout", content: null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("opensaur.identity.session=", StringComparison.Ordinal)
                     && value.Contains("expires=", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PostLogout_WhenApiCallerIsAnonymous_ReturnsUnauthorized()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(credentials.UserName, credentials.Password));

        var response = await client.PostAsync("/api/auth/logout", content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_WhenOidcAccessTokenIsValid_ReturnsCurrentUserContext()
    {
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedUserAsync(credentials.UserName, credentials.Password, [SystemRoles.Administrator]);
        using var client = CreateClient();

        var accessToken = await GetAccessTokenAsync(client, credentials.UserName, credentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/auth/me");
        var payload = await response.Content.ReadFromJsonAsync<AuthMeResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(credentials.UserName, payload.UserName);
        Assert.False(payload.RequirePasswordChange);
        Assert.Contains(SystemRoles.Administrator, payload.Roles);
    }

    [Fact]
    public async Task PostChangePassword_WhenBootstrapAdministratorUsesOidcToken_RequiresReauthentication()
    {
        var newPassword = TestFakers.CreatePassword();
        using var client = CreateClient();

        var accessToken = await GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var changePasswordResponse = await client.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest("Password1", newPassword));

        Assert.Equal(HttpStatusCode.NoContent, changePasswordResponse.StatusCode);

        using var oldPasswordClient = CreateClient();
        var oldPasswordAccessToken = await TryGetAccessTokenAsync(oldPasswordClient, "SystemAdministrator", "Password1");

        Assert.Null(oldPasswordAccessToken);

        using var newPasswordClient = CreateClient();
        var newPasswordAccessToken = await GetAccessTokenAsync(newPasswordClient, "SystemAdministrator", newPassword);
        newPasswordClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", newPasswordAccessToken);

        var meResponse = await newPasswordClient.GetAsync("/api/auth/me");
        var mePayload = await meResponse.Content.ReadFromJsonAsync<AuthMeResponse>();

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        Assert.NotNull(mePayload);
        Assert.False(mePayload.RequirePasswordChange);
    }

    private HttpClient CreateClient()
    {
        return _factory.CreateClient(
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
        if (loginResponse.StatusCode != HttpStatusCode.NoContent)
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

    private sealed record LoginRequest(string UserName, string Password);
    private sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    private sealed record AuthMeResponse(string Id, string UserName, string[] Roles, bool RequirePasswordChange);
}
