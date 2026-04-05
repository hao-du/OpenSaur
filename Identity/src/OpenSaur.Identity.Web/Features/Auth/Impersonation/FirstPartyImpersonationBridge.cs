using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using OpenSaur.Identity.Web.Infrastructure.Oidc;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public sealed class FirstPartyImpersonationBridge(IOptions<OidcOptions> oidcOptions)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan CommandLifetime = TimeSpan.FromMinutes(5);
    private static readonly HashSet<string> DisallowedReturnPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/login",
        "/auth/callback",
        "/change-password"
    };

    public string BuildStartRedirectUrl(Guid actorUserId, Guid workspaceId, Guid? userId, string redirectUri, string? returnUrl)
    {
        var command = new ImpersonationBridgeCommand(
            Action: ImpersonationBridgeAction.Start,
            ActorUserId: actorUserId,
            RedirectUri: redirectUri,
            ReturnUrl: NormalizeReturnUrl(returnUrl),
            WorkspaceId: workspaceId,
            UserId: userId,
            ExpiresAtUnixTimeSeconds: DateTimeOffset.UtcNow.Add(CommandLifetime).ToUnixTimeSeconds());

        return BuildIssuerCommandUrl("api/auth/impersonation/start", Protect(command));
    }

    public string BuildExitRedirectUrl(Guid actorUserId, string redirectUri, string? returnUrl)
    {
        var command = new ImpersonationBridgeCommand(
            Action: ImpersonationBridgeAction.Exit,
            ActorUserId: actorUserId,
            RedirectUri: redirectUri,
            ReturnUrl: NormalizeReturnUrl(returnUrl),
            WorkspaceId: null,
            UserId: null,
            ExpiresAtUnixTimeSeconds: DateTimeOffset.UtcNow.Add(CommandLifetime).ToUnixTimeSeconds());

        return BuildIssuerCommandUrl("api/auth/impersonation/exit", Protect(command));
    }

    public ImpersonationBridgeCommand? ReadCommand(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenParts = token.Split('.', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (tokenParts.Length != 2)
        {
            return null;
        }

        byte[] payloadBytes;
        byte[] providedSignature;

        try
        {
            payloadBytes = Base64UrlTextEncoder.Decode(tokenParts[0]);
            providedSignature = Base64UrlTextEncoder.Decode(tokenParts[1]);
        }
        catch (FormatException)
        {
            return null;
        }

        var expectedSignature = Sign(payloadBytes);
        if (!CryptographicOperations.FixedTimeEquals(providedSignature, expectedSignature))
        {
            return null;
        }

        var command = JsonSerializer.Deserialize<ImpersonationBridgeCommand>(payloadBytes, SerializerOptions);
        if (command is null
            || DateTimeOffset.UtcNow.ToUnixTimeSeconds() > command.ExpiresAtUnixTimeSeconds
            || command.Action is not (ImpersonationBridgeAction.Start or ImpersonationBridgeAction.Exit))
        {
            return null;
        }

        oidcOptions.Value.GetFirstPartyClient(command.RedirectUri);

        return command with
        {
            ReturnUrl = NormalizeReturnUrl(command.ReturnUrl)
        };
    }

    public string BuildAuthorizeUrl(ImpersonationBridgeCommand command)
    {
        var firstPartyClient = oidcOptions.Value.GetFirstPartyClient(command.RedirectUri);
        var authorizeUri = new Uri(GetIssuerBaseUri(), "connect/authorize");
        var query = new QueryBuilder
        {
            { "client_id", firstPartyClient.ClientId },
            { "redirect_uri", command.RedirectUri },
            { "response_type", "code" },
            { "scope", firstPartyClient.Scope },
            { "state", CreateAuthorizeState(command.ReturnUrl) }
        };

        return new UriBuilder(authorizeUri)
        {
            Query = query.ToQueryString().Value?.TrimStart('?') ?? string.Empty
        }.Uri.AbsoluteUri;
    }

    private string BuildIssuerCommandUrl(string relativePath, string token)
    {
        var commandUri = new Uri(GetIssuerBaseUri(), relativePath);
        var query = new QueryBuilder
        {
            { "command", token }
        };

        return new UriBuilder(commandUri)
        {
            Query = query.ToQueryString().Value?.TrimStart('?') ?? string.Empty
        }.Uri.AbsoluteUri;
    }

    private byte[] Sign(byte[] payloadBytes)
    {
        var clientSecret = oidcOptions.Value.GetFirstPartyClient().ClientSecret;
        if (string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new InvalidOperationException("OIDC first-party client secret is required.");
        }

        return HMACSHA256.HashData(Encoding.UTF8.GetBytes(clientSecret), payloadBytes);
    }

    private string Protect(ImpersonationBridgeCommand command)
    {
        var payloadBytes = JsonSerializer.SerializeToUtf8Bytes(command, SerializerOptions);
        var signatureBytes = Sign(payloadBytes);

        return $"{Base64UrlTextEncoder.Encode(payloadBytes)}.{Base64UrlTextEncoder.Encode(signatureBytes)}";
    }

    private Uri GetIssuerBaseUri()
    {
        if (!Uri.TryCreate(oidcOptions.Value.Issuer, UriKind.Absolute, out var issuerUri))
        {
            throw new InvalidOperationException("OIDC issuer configuration is invalid.");
        }

        return issuerUri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal)
            ? issuerUri
            : new Uri($"{issuerUri.AbsoluteUri}/", UriKind.Absolute);
    }

    private static string CreateAuthorizeState(string returnUrl)
    {
        return Uri.EscapeDataString(JsonSerializer.Serialize(new
        {
            nonce = Guid.NewGuid().ToString("D"),
            returnUrl
        }));
    }

    private static string NormalizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) || !returnUrl.StartsWith("/", StringComparison.Ordinal))
        {
            return "/";
        }

        try
        {
            var normalizedUri = new Uri(new Uri("http://localhost"), returnUrl);
            var resolvedReturnUrl = $"{normalizedUri.AbsolutePath}{normalizedUri.Query}{normalizedUri.Fragment}";

            return DisallowedReturnPaths.Contains(normalizedUri.AbsolutePath)
                ? "/"
                : resolvedReturnUrl;
        }
        catch (UriFormatException)
        {
            return "/";
        }
    }

    public sealed record ImpersonationBridgeCommand(
        string Action,
        Guid ActorUserId,
        string RedirectUri,
        string ReturnUrl,
        Guid? WorkspaceId,
        Guid? UserId,
        long ExpiresAtUnixTimeSeconds);

    private static class ImpersonationBridgeAction
    {
        public const string Exit = "exit";
        public const string Start = "start";
    }
}
