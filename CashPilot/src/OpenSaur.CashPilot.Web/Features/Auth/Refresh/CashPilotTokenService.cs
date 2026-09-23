using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;
using OpenSaur.CashPilot.Web.Infrastructure.ConfigurationOptions;

namespace OpenSaur.CashPilot.Web.Features.Auth.Refresh;

public class CashPilotTokenService(
    IHttpClientFactory httpClientFactory,
    IOptions<OidcOptions> oidcOptions,
    ILogger<CashPilotTokenService> logger) : ITokenService
{
    public const string HttpClientName = "CashPilotTokenClient";

    public async Task<TokenRefreshResult?> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient(HttpClientName);
        var options = oidcOptions.Value;

        if (client.BaseAddress == null && !string.IsNullOrWhiteSpace(options.Authority))
        {
            client.BaseAddress = new Uri(options.Authority);
        }

        var parameters = new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
            ["client_id"] = string.IsNullOrWhiteSpace(options.ClientId) ? "cashpilot" : options.ClientId
        };

        if (!string.IsNullOrWhiteSpace(options.ClientSecret))
        {
            parameters["client_secret"] = options.ClientSecret;
        }

        var content = new FormUrlEncodedContent(parameters);

        try
        {
            var response = await client.PostAsync("/connect/token", content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Token refresh request returned status code: {StatusCode}", response.StatusCode);
                return null;
            }

            var result = await response.Content.ReadFromJsonAsync<CashPilotTokenResponse>(cancellationToken);
            if (result == null || string.IsNullOrWhiteSpace(result.AccessToken))
            {
                logger.LogWarning("Token refresh response content was invalid.");
                return null;
            }

            return new TokenRefreshResult(
                result.AccessToken,
                result.RefreshToken ?? refreshToken,
                result.ExpiresIn);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to refresh token from authorization server.");
            return null;
        }
    }

    private sealed class CashPilotTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = string.Empty;
    }
}
