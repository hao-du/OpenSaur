using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class FirstPartyOidcTokenClient : IFirstPartyOidcTokenClient
{
    private readonly HttpClient _httpClient;
    private readonly IOptions<OidcOptions> _oidcOptions;

    public FirstPartyOidcTokenClient(HttpClient httpClient, IOptions<OidcOptions> oidcOptions)
    {
        _httpClient = httpClient;
        _oidcOptions = oidcOptions;
    }

    public async Task<FirstPartyOidcTokenResult?> ExchangeAuthorizationCodeAsync(
        string code,
        CancellationToken cancellationToken)
    {
        var firstPartyWeb = _oidcOptions.Value.FirstPartyWeb;
        if (string.IsNullOrWhiteSpace(firstPartyWeb.ClientId)
            || string.IsNullOrWhiteSpace(firstPartyWeb.ClientSecret)
            || string.IsNullOrWhiteSpace(firstPartyWeb.RedirectUri))
        {
            throw new InvalidOperationException("OIDC first-party web client configuration is required.");
        }

        using var response = await _httpClient.PostAsync(
            "/connect/token",
            new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("client_id", firstPartyWeb.ClientId),
                new KeyValuePair<string, string>("client_secret", firstPartyWeb.ClientSecret),
                new KeyValuePair<string, string>("redirect_uri", firstPartyWeb.RedirectUri),
                new KeyValuePair<string, string>("code", code)
            ]),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        await using var payloadStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var payload = await JsonDocument.ParseAsync(payloadStream, cancellationToken: cancellationToken);

        var accessToken = payload.RootElement.GetProperty("access_token").GetString();
        var refreshToken = payload.RootElement.GetProperty("refresh_token").GetString();
        if (string.IsNullOrWhiteSpace(accessToken) || string.IsNullOrWhiteSpace(refreshToken))
        {
            return null;
        }

        var expiresInSeconds = payload.RootElement.TryGetProperty("expires_in", out var expiresInElement)
            && expiresInElement.TryGetInt32(out var expiresIn)
                ? expiresIn
                : 3600;

        return new FirstPartyOidcTokenResult(
            accessToken,
            refreshToken,
            DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds));
    }
}
