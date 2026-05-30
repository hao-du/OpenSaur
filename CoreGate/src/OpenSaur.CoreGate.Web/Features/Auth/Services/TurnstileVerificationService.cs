using System.Text.Json;
using Microsoft.Extensions.Options;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class TurnstileVerificationService(
    IHttpClientFactory httpClientFactory,
    IOptions<TurnstileOptions> turnstileOptions)
{
    private static readonly Uri VerifyUri = new("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public string SiteKey => turnstileOptions.Value.SiteKey;

    public bool Enabled => !string.IsNullOrWhiteSpace(turnstileOptions.Value.SiteKey);

    public async Task<bool> VerifyAsync(string token, string? remoteIp, CancellationToken cancellationToken = default)
    {
        if (!Enabled)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(turnstileOptions.Value.SecretKey))
        {
            return false;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, VerifyUri)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["secret"] = turnstileOptions.Value.SecretKey,
                ["response"] = token,
                ["remoteip"] = remoteIp ?? string.Empty
            })
        };

        using var client = httpClientFactory.CreateClient();
        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return false;
        }

        await using var content = await response.Content.ReadAsStreamAsync(cancellationToken);
        var verification = await JsonSerializer.DeserializeAsync<TurnstileVerifyResponse>(content, JsonOptions, cancellationToken);
        return verification?.Success is true;
    }

    private sealed record TurnstileVerifyResponse(bool Success);
}
