using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;

namespace OpenSaur.Zentry.Web.Features.Bff.Refresh;

public class CoreGateTokenService(
    IHttpClientFactory httpClientFactory,
    IOptions<OidcOptions> oidcOptions,
    ILogger<CoreGateTokenService> logger) : ITokenService
{
    public async Task<TokenRefreshResult?> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var client = httpClientFactory.CreateClient("CoreGateTokenClient");
        var tokenEndpoint = $"{oidcOptions.Value.Authority.TrimEnd('/')}/connect/token";

        var parameters = new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
            ["client_id"] = oidcOptions.Value.ClientId
        };

        if (!string.IsNullOrWhiteSpace(oidcOptions.Value.ClientSecret))
        {
            parameters["client_secret"] = oidcOptions.Value.ClientSecret;
        }

        try
        {
            using var response = await client.PostAsync(tokenEndpoint, new FormUrlEncodedContent(parameters), cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("CoreGate token refresh failed with status code {StatusCode}", response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var newAccessToken = root.GetProperty("access_token").GetString();
            if (string.IsNullOrWhiteSpace(newAccessToken))
            {
                return null;
            }

            var newRefreshToken = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : refreshToken;
            var expiresIn = root.TryGetProperty("expires_in", out var exp) ? exp.GetInt32() : 3600;

            return new TokenRefreshResult(newAccessToken, newRefreshToken ?? refreshToken, expiresIn);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while refreshing token with CoreGate.");
            return null;
        }
    }
}

