using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;

namespace OpenSaur.Identity.Web.Tests.Support;

public static class OidcTestClient
{
    public static async Task CompleteApiLoginAsync(
        HttpClient client,
        string clientId,
        string redirectUri,
        string userName,
        string password)
    {
        var authorizeResponse = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientId, redirectUri, "oidc-state"));
        var loginUri = authorizeResponse.Headers.Location ?? throw new InvalidOperationException("Hosted login redirect was expected.");
        var loginQuery = QueryHelpers.ParseQuery(loginUri.Query);
        var returnUrl = loginQuery["returnUrl"].ToString();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = userName, Password = password });
        await ApiResponseReader.AssertNullSuccessDataAsync(loginResponse);
        var finalAuthorizeResponse = await client.GetAsync(returnUrl);

        Assert.Equal(HttpStatusCode.Redirect, finalAuthorizeResponse.StatusCode);
        Assert.NotNull(finalAuthorizeResponse.Headers.Location);
        Assert.Equal(redirectUri, finalAuthorizeResponse.Headers.Location!.GetLeftPart(UriPartial.Path));
    }

    public static async Task<string> AuthorizeAsync(
        HttpClient client,
        string clientId,
        string redirectUri,
        string userName,
        string password)
    {
        var authorizeResponse = await client.GetAsync(
            FirstPartyApiTestClient.CreateAuthorizeUrl(clientId, redirectUri, "oidc-state"));
        var loginUri = authorizeResponse.Headers.Location ?? throw new InvalidOperationException("Hosted login redirect was expected.");
        var loginQuery = QueryHelpers.ParseQuery(loginUri.Query);
        var returnUrl = loginQuery["returnUrl"].ToString();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { UserName = userName, Password = password });
        await ApiResponseReader.AssertNullSuccessDataAsync(loginResponse);
        var callbackResponse = await client.GetAsync(returnUrl);
        var callbackUri = callbackResponse.Headers.Location ?? throw new InvalidOperationException("Client callback redirect was expected.");
        var callbackQuery = QueryHelpers.ParseQuery(callbackUri.Query);

        return callbackQuery["code"].ToString();
    }

    public static async Task<OidcTokenResponse> ReadTokenResponseAsync(HttpResponseMessage response)
    {
        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);

        return new OidcTokenResponse(
            document.RootElement.GetProperty("access_token").GetString() ?? string.Empty,
            document.RootElement.GetProperty("refresh_token").GetString() ?? string.Empty,
            document.RootElement.GetProperty("token_type").GetString() ?? string.Empty);
    }
}

public sealed record OidcTokenResponse(string AccessToken, string RefreshToken, string TokenType);
