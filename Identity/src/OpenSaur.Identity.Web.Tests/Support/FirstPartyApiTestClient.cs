using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.WebUtilities;

namespace OpenSaur.Identity.Web.Tests.Support;

public static class FirstPartyApiTestClient
{
    public const string ClientId = "first-party-web";
    public const string RedirectUri = "https://first-party.test.opensaur/auth/callback";
    public const string ClientSecret = "test-first-party-secret";
    public const string Scope = "openid profile email roles offline_access api";

    public static HttpClient CreateClient(OpenSaurWebApplicationFactory factory)
    {
        return factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer),
                HandleCookies = true
            });
    }

    public static async Task<string> GetAccessTokenAsync(
        HttpClient client,
        string userName,
        string password,
        string? state = null)
    {
        var accessToken = await TryGetAccessTokenAsync(
            client,
            ClientId,
            RedirectUri,
            ClientSecret,
            userName,
            password,
            state,
            Scope);
        return accessToken ?? throw new InvalidOperationException("Access token was expected.");
    }

    public static async Task<string?> TryGetAccessTokenAsync(
        HttpClient client,
        string userName,
        string password,
        string? state = null)
    {
        return await TryGetAccessTokenAsync(
            client,
            ClientId,
            RedirectUri,
            ClientSecret,
            userName,
            password,
            state,
            Scope);
    }

    public static async Task<string> GetAccessTokenAsync(
        HttpClient client,
        string clientId,
        string redirectUri,
        string clientSecret,
        string userName,
        string password,
        string? state = null,
        string? scope = null)
    {
        var accessToken = await TryGetAccessTokenAsync(
            client,
            clientId,
            redirectUri,
            clientSecret,
            userName,
            password,
            state,
            scope);
        return accessToken ?? throw new InvalidOperationException("Access token was expected.");
    }

    public static async Task<string?> TryGetAccessTokenAsync(
        HttpClient client,
        string clientId,
        string redirectUri,
        string clientSecret,
        string userName,
        string password,
        string? state = null,
        string? scope = null)
    {
        var authorizeResponse = await client.GetAsync(CreateAuthorizeUrl(clientId, redirectUri, state, scope));
        var loginUri = authorizeResponse.Headers.Location ?? throw new InvalidOperationException("FE login redirect was expected.");
        var loginQuery = QueryHelpers.ParseQuery(loginUri.Query);
        var returnUrl = loginQuery["returnUrl"].ToString();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { UserName = userName, Password = password });
        if (loginResponse.StatusCode != HttpStatusCode.OK)
        {
            return null;
        }

        var callbackResponse = await client.GetAsync(returnUrl);
        if (callbackResponse.StatusCode != HttpStatusCode.Redirect
            || callbackResponse.Headers.Location is null
            || !string.Equals(callbackResponse.Headers.Location.GetLeftPart(UriPartial.Path), redirectUri, StringComparison.Ordinal))
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
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", clientSecret),
                new KeyValuePair<string, string>("redirect_uri", redirectUri),
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

    public static Task<HttpResponseMessage> PostAsJsonWithIdempotencyAsync<TRequest>(
        HttpClient client,
        string requestUri,
        TRequest payload,
        string? idempotencyKey = null)
    {
        return SendJsonWithIdempotencyAsync(client, HttpMethod.Post, requestUri, payload, idempotencyKey);
    }

    public static Task<HttpResponseMessage> PutAsJsonWithIdempotencyAsync<TRequest>(
        HttpClient client,
        string requestUri,
        TRequest payload,
        string? idempotencyKey = null)
    {
        return SendJsonWithIdempotencyAsync(client, HttpMethod.Put, requestUri, payload, idempotencyKey);
    }

    public static async Task<HttpResponseMessage> SendJsonWithIdempotencyAsync<TRequest>(
        HttpClient client,
        HttpMethod method,
        string requestUri,
        TRequest payload,
        string? idempotencyKey = null)
    {
        using var request = new HttpRequestMessage(method, requestUri)
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));

        return await client.SendAsync(request);
    }

    public static string CreateAuthorizeUrl(string? state = null)
    {
        return CreateAuthorizeUrl(ClientId, RedirectUri, state, Scope);
    }

    public static string CreateAuthorizeUrl(
        string clientId,
        string redirectUri,
        string? state = null,
        string? scope = null)
    {
        return QueryHelpers.AddQueryString(
            "/connect/authorize",
            new Dictionary<string, string?>
            {
                ["client_id"] = clientId,
                ["redirect_uri"] = redirectUri,
                ["response_type"] = "code",
                ["scope"] = string.IsNullOrWhiteSpace(scope) ? Scope : scope,
                ["state"] = string.IsNullOrWhiteSpace(state) ? "first-party-state" : state
            });
    }
}
