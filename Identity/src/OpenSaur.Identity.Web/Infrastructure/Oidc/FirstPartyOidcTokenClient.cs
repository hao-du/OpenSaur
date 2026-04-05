using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class FirstPartyOidcTokenClient : IFirstPartyOidcTokenClient
{
    private static readonly JsonSerializerOptions TokenResponseSerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly ILogger<FirstPartyOidcTokenClient> _logger;
    private readonly ManagedOidcClientResolver _managedOidcClientResolver;

    public FirstPartyOidcTokenClient(
        HttpClient httpClient,
        ILogger<FirstPartyOidcTokenClient> logger,
        ManagedOidcClientResolver managedOidcClientResolver)
    {
        _httpClient = httpClient;
        _logger = logger;
        _managedOidcClientResolver = managedOidcClientResolver;
    }

    public async Task<FirstPartyOidcTokenResult?> ExchangeAuthorizationCodeAsync(
        string code,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        var browserClient = await GetConfiguredFirstPartyClientAsync(redirectUri, requireSecret: true, cancellationToken);

        return await SendTokenRequestAsync(
            new Dictionary<string, string>
            {
                ["grant_type"] = GrantTypes.AuthorizationCode,
                ["client_id"] = browserClient.ClientId,
                ["client_secret"] = browserClient.ClientSecret,
                ["redirect_uri"] = redirectUri,
                ["code"] = code
            },
            cancellationToken);
    }

    public async Task<FirstPartyOidcTokenResult?> RefreshAccessTokenAsync(
        string refreshToken,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        var browserClient = await GetConfiguredFirstPartyClientAsync(redirectUri, requireSecret: true, cancellationToken);

        return await SendTokenRequestAsync(
            new Dictionary<string, string>
            {
                ["grant_type"] = GrantTypes.RefreshToken,
                ["client_id"] = browserClient.ClientId,
                ["client_secret"] = browserClient.ClientSecret,
                ["refresh_token"] = refreshToken
            },
            cancellationToken);
    }

    private async Task<FirstPartyOidcTokenResult?> SendTokenRequestAsync(
        IReadOnlyDictionary<string, string> formValues,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "connect/token")
        {
            Content = new FormUrlEncodedContent(formValues)
        };
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "OIDC first-party token request to {TokenEndpoint} failed.",
                new Uri(_httpClient.BaseAddress!, request.RequestUri!).AbsoluteUri);
            throw;
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "OIDC first-party token request to {TokenEndpoint} failed with status code {StatusCode}.",
                    request.RequestUri is null
                        ? "connect/token"
                        : new Uri(_httpClient.BaseAddress!, request.RequestUri).AbsoluteUri,
                    (int)response.StatusCode);
                return null;
            }

            var tokenResponse = await response.Content.ReadFromJsonAsync<OidcTokenResponse>(
                TokenResponseSerializerOptions,
                cancellationToken);
            if (tokenResponse is null
                || string.IsNullOrWhiteSpace(tokenResponse.AccessToken)
                || string.IsNullOrWhiteSpace(tokenResponse.RefreshToken))
            {
                return null;
            }

            var expiresAt = tokenResponse.ExpiresIn > 0
                ? DateTimeOffset.UtcNow.AddSeconds(tokenResponse.ExpiresIn)
                : DateTimeOffset.UtcNow.Add(OidcDefaults.AccessTokenLifetime);

            return new FirstPartyOidcTokenResult(
                tokenResponse.AccessToken,
                tokenResponse.RefreshToken,
                expiresAt);
        }
    }

    private async Task<ManagedOidcClientRuntime> GetConfiguredFirstPartyClientAsync(
        string redirectUri,
        bool requireSecret,
        CancellationToken cancellationToken)
    {
        var browserClient = await _managedOidcClientResolver.ResolveClientByRedirectUriAsync(
            redirectUri,
            cancellationToken);
        if (browserClient is null)
        {
            throw new InvalidOperationException($"No active managed OIDC client matched redirect URI '{redirectUri}'.");
        }

        if (string.IsNullOrWhiteSpace(browserClient.ClientId)
            || requireSecret && string.IsNullOrWhiteSpace(browserClient.ClientSecret))
        {
            throw new InvalidOperationException("OIDC first-party client configuration is required.");
        }

        return browserClient;
    }

    private sealed class OidcTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; init; }

        [JsonPropertyName("expires_in")]
        public long ExpiresIn { get; init; }

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; init; }
    }
}
