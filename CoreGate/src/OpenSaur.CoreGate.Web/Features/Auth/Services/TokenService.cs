using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Npgsql.Internal;
using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;
using System.Net.Http.Headers;
using System.Text.Json;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class TokenService(
    IHttpClientFactory httpClientFactory,
    IHttpContextAccessor httpContextAccessor,
    IOptions<CorsOptions> corsOptions,
    IOptions<OidcOptions> oidcOptions,
    CookieService tokenCookieService
)
{
    public const string HttpClientName = "TokenProxyHandler";
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task<IResult> ProxyTokenRequestAsync(IReadOnlyDictionary<string, string> form, bool clearRefreshCookieOnFailure)
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, new Uri(oidcOptions.Value.GetIssuerBaseUri(), "connect/token"));
        requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        requestMessage.Content = new FormUrlEncodedContent(form);

        using var client = httpClientFactory.CreateClient(HttpClientName);
        using var responseMessage = await client.SendAsync(requestMessage, httpContext.RequestAborted);
        var content = await responseMessage.Content.ReadAsStringAsync(httpContext.RequestAborted);

        if (!responseMessage.IsSuccessStatusCode)
        {
            if (clearRefreshCookieOnFailure)
            {
                tokenCookieService.ClearRefreshTokenCookie(httpContext.Response);
            }

            return Results.Content(
                content,
                "application/json; charset=utf-8",
                statusCode: (int)responseMessage.StatusCode);
        }

        using var payload = JsonDocument.Parse(content);
        var root = payload.RootElement;

        if (!root.TryGetProperty("access_token", out var accessTokenElement)
            || !root.TryGetProperty("expires_in", out var expiresInElement))
        {
            if (clearRefreshCookieOnFailure)
            {
                tokenCookieService.ClearRefreshTokenCookie(httpContext.Response);
            }

            return Results.Problem("CoreGate token response is missing required fields.");
        }

        if (root.TryGetProperty("refresh_token", out var refreshTokenElement)
            && refreshTokenElement.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(refreshTokenElement.GetString()))
        {
            tokenCookieService.WriteRefreshTokenCookie(httpContext.Response, refreshTokenElement.GetString()!);
        }

        var tokenResponse = new TokenResponse(
            accessTokenElement.GetString() ?? string.Empty,
            expiresInElement.GetInt32(),
            root.TryGetProperty("token_type", out var tokenTypeElement) && tokenTypeElement.ValueKind == JsonValueKind.String
                ? tokenTypeElement.GetString() ?? "Bearer"
                : "Bearer",
            root.TryGetProperty("scope", out var scopeElement) && scopeElement.ValueKind == JsonValueKind.String
                ? scopeElement.GetString()
                : null,
            root.TryGetProperty("id_token", out var idTokenElement) && idTokenElement.ValueKind == JsonValueKind.String
                ? idTokenElement.GetString()
                : null);

        return Results.Json(tokenResponse, SerializerOptions);
    }

    public bool IsAllowedOrigin()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        if (!httpContext.Request.Headers.TryGetValue("Origin", out StringValues originHeader)
            || StringValues.IsNullOrEmpty(originHeader))
        {
            return false;
        }

        return corsOptions.Value.AllowedOrigins.Contains(originHeader.ToString(), StringComparer.OrdinalIgnoreCase);
    }
}
