using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Features.Auth;

public sealed class OidcAuthorizationFlowTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private const string ClientSecret = "test-third-party-secret";

    private readonly OpenSaurWebApplicationFactory _factory;

    public OidcAuthorizationFlowTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetAuthorize_WhenAnonymous_RedirectsToFeLoginRoute()
    {
        const string clientId = "third-party-client";
        const string redirectUri = "https://client.test.opensaur/signin-oidc";
        await _factory.SeedOidcClientAsync(clientId, redirectUri, ClientSecret);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var response = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientId, redirectUri, "oidc-state"));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Equal("/login", response.Headers.Location!.AbsolutePath);

        var query = QueryHelpers.ParseQuery(response.Headers.Location.Query);
        Assert.True(query.TryGetValue("returnUrl", out var returnUrl));
        Assert.Contains("/connect/authorize", returnUrl.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task PostApiLogin_WhenCredentialsAreValid_ContinuesAuthorizationRequestAndIssuesCode()
    {
        const string clientId = "third-party-client";
        const string redirectUri = "https://client.test.opensaur/signin-oidc";
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedOidcClientAsync(clientId, redirectUri, ClientSecret);
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var authorizeResponse = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientId, redirectUri, "oidc-state"));
        var loginUri = authorizeResponse.Headers.Location;

        Assert.Equal(HttpStatusCode.Redirect, authorizeResponse.StatusCode);
        Assert.NotNull(loginUri);

        var loginQuery = QueryHelpers.ParseQuery(loginUri!.Query);
        var returnUrl = loginQuery["returnUrl"].ToString();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = credentials.UserName, Password = credentials.Password });

        await ApiResponseReader.AssertNullSuccessDataAsync(loginResponse);
        Assert.Contains(
            loginResponse.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("opensaur.identity.session=", StringComparison.Ordinal));

        var continuedAuthorizeResponse = await client.GetAsync(returnUrl);

        Assert.Equal(HttpStatusCode.Redirect, continuedAuthorizeResponse.StatusCode);
        Assert.NotNull(continuedAuthorizeResponse.Headers.Location);
        Assert.Equal(redirectUri, continuedAuthorizeResponse.Headers.Location!.GetLeftPart(UriPartial.Path));

        var callbackQuery = QueryHelpers.ParseQuery(continuedAuthorizeResponse.Headers.Location.Query);
        Assert.True(callbackQuery.ContainsKey("code"));
        Assert.Equal("oidc-state", callbackQuery["state"].ToString());
    }

    [Fact]
    public async Task GetAuthorize_WhenHostedSessionAlreadyExists_SkipsCredentialEntryForAnotherClient()
    {
        const string clientIdOne = "third-party-client-one";
        const string redirectUriOne = "https://client-one.test.opensaur/signin-oidc";
        const string clientIdTwo = "third-party-client-two";
        const string redirectUriTwo = "https://client-two.test.opensaur/signin-oidc";
        var credentials = TestFakers.CreateUserCredentials();

        await _factory.SeedOidcClientAsync(clientIdOne, redirectUriOne, ClientSecret);
        await _factory.SeedOidcClientAsync(clientIdTwo, redirectUriTwo, ClientSecret);
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        await OidcTestClient.CompleteApiLoginAsync(client, clientIdOne, redirectUriOne, credentials.UserName, credentials.Password);

        var secondAuthorizeResponse = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientIdTwo, redirectUriTwo, "oidc-state"));

        Assert.Equal(HttpStatusCode.Redirect, secondAuthorizeResponse.StatusCode);
        Assert.NotNull(secondAuthorizeResponse.Headers.Location);
        Assert.Equal(redirectUriTwo, secondAuthorizeResponse.Headers.Location!.GetLeftPart(UriPartial.Path));

        var callbackQuery = QueryHelpers.ParseQuery(secondAuthorizeResponse.Headers.Location.Query);
        Assert.True(callbackQuery.ContainsKey("code"));
        Assert.Equal("oidc-state", callbackQuery["state"].ToString());
    }

    [Fact]
    public async Task PostApiLogin_WhenCredentialsAreInvalid_ReturnsUnauthorizedAndDoesNotIssueSessionCookie()
    {
        const string clientId = "third-party-client";
        const string redirectUri = "https://client.test.opensaur/signin-oidc";
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedOidcClientAsync(clientId, redirectUri, ClientSecret);
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var authorizeResponse = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientId, redirectUri, "oidc-state"));
        var loginUri = authorizeResponse.Headers.Location;

        Assert.Equal(HttpStatusCode.Redirect, authorizeResponse.StatusCode);
        Assert.NotNull(loginUri);

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new
            {
                UserName = credentials.UserName,
                Password = TestFakers.CreateDifferentPassword(credentials.Password)
            });

        await ApiResponseReader.ReadFailureEnvelopeAsync(loginResponse, HttpStatusCode.Unauthorized);
        Assert.DoesNotContain("Set-Cookie", loginResponse.Headers.Select(header => header.Key), StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PostApiLogin_WhenUserOrWorkspaceIsInactive_ReturnsUnauthorized()
    {
        const string clientId = "third-party-client";
        const string redirectUri = "https://client.test.opensaur/signin-oidc";
        var credentials = TestFakers.CreateUserCredentials();
        await _factory.SeedOidcClientAsync(clientId, redirectUri, ClientSecret);
        await TestIdentitySeeder.SeedUserAsync(
            _factory,
            credentials.UserName,
            credentials.Password,
            [SystemRoles.User],
            isActive: true,
            workspaceIsActive: false);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var authorizeResponse = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientId, redirectUri, "oidc-state"));
        var loginUri = authorizeResponse.Headers.Location;

        Assert.Equal(HttpStatusCode.Redirect, authorizeResponse.StatusCode);
        Assert.NotNull(loginUri);

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = credentials.UserName, Password = credentials.Password });

        await ApiResponseReader.ReadFailureEnvelopeAsync(loginResponse, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostToken_WhenAuthorizationCodeIsValid_ReturnsAccessAndRefreshTokensAndRotatesRefreshChain()
    {
        const string clientId = "third-party-client";
        const string redirectUri = "https://client.test.opensaur/signin-oidc";
        var credentials = TestFakers.CreateUserCredentials();

        await _factory.SeedOidcClientAsync(clientId, redirectUri, ClientSecret);
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var authorizationCode = await OidcTestClient.AuthorizeAsync(client, clientId, redirectUri, credentials.UserName, credentials.Password);

        var tokenResponse = await client.PostAsync(
            "/connect/token",
            new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", ClientSecret),
                new KeyValuePair<string, string>("redirect_uri", redirectUri),
                new KeyValuePair<string, string>("code", authorizationCode)
            ]));

        Assert.Equal(HttpStatusCode.OK, tokenResponse.StatusCode);

        var tokenPayload = await OidcTestClient.ReadTokenResponseAsync(tokenResponse);

        Assert.False(string.IsNullOrWhiteSpace(tokenPayload.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(tokenPayload.RefreshToken));
        Assert.Equal("Bearer", tokenPayload.TokenType, ignoreCase: true);

        var refreshResponse = await client.PostAsync(
            "/connect/token",
            new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "refresh_token"),
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", ClientSecret),
                new KeyValuePair<string, string>("refresh_token", tokenPayload.RefreshToken)
            ]));

        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);

        var refreshPayload = await OidcTestClient.ReadTokenResponseAsync(refreshResponse);

        Assert.False(string.IsNullOrWhiteSpace(refreshPayload.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(refreshPayload.RefreshToken));
        Assert.NotEqual(tokenPayload.RefreshToken, refreshPayload.RefreshToken);

        var replayResponse = await client.PostAsync(
            "/connect/token",
            new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "refresh_token"),
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", ClientSecret),
                new KeyValuePair<string, string>("refresh_token", tokenPayload.RefreshToken)
            ]));

        Assert.Equal(HttpStatusCode.BadRequest, replayResponse.StatusCode);

        await using var replayStream = await replayResponse.Content.ReadAsStreamAsync();
        using var replayDocument = await JsonDocument.ParseAsync(replayStream);
        Assert.Equal("invalid_grant", replayDocument.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task PostApiLogout_WhenHostedSessionExists_ClearsSessionAndForcesLoginAgain()
    {
        const string clientId = "third-party-client";
        const string redirectUri = "https://client.test.opensaur/signin-oidc";
        var credentials = TestFakers.CreateUserCredentials();

        await _factory.SeedOidcClientAsync(clientId, redirectUri, ClientSecret);
        await TestIdentitySeeder.SeedUserAsync(_factory, credentials.UserName, credentials.Password, [SystemRoles.User]);
        using var client = FirstPartyApiTestClient.CreateClient(_factory);

        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(
            client,
            clientId,
            redirectUri,
            ClientSecret,
            credentials.UserName,
            credentials.Password,
            "oidc-state");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var logoutResponse = await client.PostAsync("/api/auth/logout", content: null);

        await ApiResponseReader.AssertNullSuccessDataAsync(logoutResponse);
        Assert.Contains(
            logoutResponse.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("opensaur.identity.session=", StringComparison.Ordinal)
                     && value.Contains("expires=", StringComparison.OrdinalIgnoreCase));

        var authorizeResponse = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientId, redirectUri, "oidc-state"));

        Assert.Equal(HttpStatusCode.Redirect, authorizeResponse.StatusCode);
        Assert.NotNull(authorizeResponse.Headers.Location);
        Assert.Equal("/login", authorizeResponse.Headers.Location!.AbsolutePath);
    }

}
