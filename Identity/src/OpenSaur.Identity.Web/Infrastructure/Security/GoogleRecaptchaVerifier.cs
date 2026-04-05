using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace OpenSaur.Identity.Web.Infrastructure.Security;

public sealed class GoogleRecaptchaVerifier(
    HttpClient httpClient,
    IOptions<GoogleRecaptchaOptions> optionsAccessor,
    ILogger<GoogleRecaptchaVerifier> logger) : IGoogleRecaptchaVerifier
{
    private readonly GoogleRecaptchaOptions _options = optionsAccessor.Value;

    public bool IsEnabled => _options.IsConfigured;

    public string SiteKey => _options.SiteKey;

    public string LoginAction => _options.LoginAction;

    public async Task<GoogleRecaptchaVerificationResult> VerifyLoginAsync(
        string? token,
        string? remoteIp,
        CancellationToken cancellationToken = default)
    {
        if (!IsEnabled)
        {
            return GoogleRecaptchaVerificationResult.Passed();
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return GoogleRecaptchaVerificationResult.Failed();
        }

        List<KeyValuePair<string, string>> formValues =
        [
            new("secret", _options.SecretKey),
            new("response", token)
        ];

        if (!string.IsNullOrWhiteSpace(remoteIp))
        {
            formValues.Add(new KeyValuePair<string, string>("remoteip", remoteIp));
        }

        try
        {
            using var response = await httpClient.PostAsync(
                "siteverify",
                new FormUrlEncodedContent(formValues),
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Google reCAPTCHA verification returned HTTP {StatusCode}.",
                    (int)response.StatusCode);
                return GoogleRecaptchaVerificationResult.ServiceFailure();
            }

            var payload = await response.Content.ReadFromJsonAsync<GoogleRecaptchaSiteVerifyResponse>(cancellationToken);
            if (payload is null)
            {
                logger.LogWarning("Google reCAPTCHA verification returned an empty payload.");
                return GoogleRecaptchaVerificationResult.ServiceFailure();
            }

            var isVerified = payload.Success
                             && string.Equals(payload.Action, _options.LoginAction, StringComparison.Ordinal)
                             && payload.Score.GetValueOrDefault() >= _options.MinimumScore;

            if (!isVerified)
            {
                logger.LogInformation(
                    "Google reCAPTCHA verification failed. Action: {Action}, Score: {Score}, ErrorCodes: {ErrorCodes}",
                    payload.Action,
                    payload.Score,
                    payload.ErrorCodes is null ? string.Empty : string.Join(",", payload.ErrorCodes));
                return GoogleRecaptchaVerificationResult.Failed();
            }

            return GoogleRecaptchaVerificationResult.Passed();
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(exception, "Google reCAPTCHA verification request failed.");
            return GoogleRecaptchaVerificationResult.ServiceFailure();
        }
    }

    private sealed record GoogleRecaptchaSiteVerifyResponse(
        [property: JsonPropertyName("success")] bool Success,
        [property: JsonPropertyName("score")] double? Score,
        [property: JsonPropertyName("action")] string? Action,
        [property: JsonPropertyName("error-codes")] string[]? ErrorCodes);
}
