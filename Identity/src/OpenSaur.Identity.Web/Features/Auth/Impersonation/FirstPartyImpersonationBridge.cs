using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using OpenSaur.Identity.Web.Infrastructure.Oidc;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public sealed class FirstPartyImpersonationBridge(
    IOptions<OidcOptions> oidcOptions,
    ManagedOidcClientResolver managedOidcClientResolver)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan CommandLifetime = TimeSpan.FromMinutes(5);
    private static readonly HashSet<string> DisallowedReturnPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/login",
        "/auth/callback",
        "/change-password"
    };

    public async Task<string> BuildStartRedirectUrlAsync(
        Guid actorUserId,
        Guid workspaceId,
        Guid? userId,
        string redirectUri,
        string? returnUrl,
        CancellationToken cancellationToken = default)
    {
        var command = new ImpersonationBridgeCommand(
            Action: ImpersonationBridgeAction.Start,
            ActorUserId: actorUserId,
            RedirectUri: redirectUri,
            ReturnUrl: NormalizeReturnUrl(returnUrl),
            WorkspaceId: workspaceId,
            UserId: userId,
            ExpiresAtUnixTimeSeconds: DateTimeOffset.UtcNow.Add(CommandLifetime).ToUnixTimeSeconds());

        return BuildIssuerCommandUrl(
            "api/auth/impersonation/start",
            await ProtectAsync(command, cancellationToken));
    }

    public async Task<string> BuildExitRedirectUrlAsync(
        Guid actorUserId,
        string redirectUri,
        string? returnUrl,
        CancellationToken cancellationToken = default)
    {
        var command = new ImpersonationBridgeCommand(
            Action: ImpersonationBridgeAction.Exit,
            ActorUserId: actorUserId,
            RedirectUri: redirectUri,
            ReturnUrl: NormalizeReturnUrl(returnUrl),
            WorkspaceId: null,
            UserId: null,
            ExpiresAtUnixTimeSeconds: DateTimeOffset.UtcNow.Add(CommandLifetime).ToUnixTimeSeconds());

        return BuildIssuerCommandUrl(
            "api/auth/impersonation/exit",
            await ProtectAsync(command, cancellationToken));
    }

    public async Task<ImpersonationBridgeCommand?> ReadCommandAsync(
        string? token,
        CancellationToken cancellationToken = default)
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

        var command = JsonSerializer.Deserialize<ImpersonationBridgeCommand>(payloadBytes, SerializerOptions);
        if (command is null
            || DateTimeOffset.UtcNow.ToUnixTimeSeconds() > command.ExpiresAtUnixTimeSeconds
            || command.Action is not (ImpersonationBridgeAction.Start or ImpersonationBridgeAction.Exit))
        {
            return null;
        }

        var expectedSignature = await SignAsync(payloadBytes, command.RedirectUri, cancellationToken);
        if (!CryptographicOperations.FixedTimeEquals(providedSignature, expectedSignature))
        {
            return null;
        }

        var managedClient = await managedOidcClientResolver.ResolveClientByRedirectUriAsync(
            command.RedirectUri,
            cancellationToken);
        if (managedClient is null)
        {
            return null;
        }

        return command with
        {
            ReturnUrl = NormalizeReturnUrl(command.ReturnUrl)
        };
    }

    public async Task<string> BuildCompletionUrlAsync(
        ImpersonationBridgeCommand command,
        CancellationToken cancellationToken = default)
    {
        return IsIssuerHostedRedirectUri(command.RedirectUri)
            ? BuildIssuerHostedReturnUrl(command.ReturnUrl)
            : await BuildAuthorizeUrlAsync(command, cancellationToken);
    }

    public async Task<string> BuildAuthorizeUrlAsync(
        ImpersonationBridgeCommand command,
        CancellationToken cancellationToken = default)
    {
        var firstPartyClient = await managedOidcClientResolver.ResolveClientByRedirectUriAsync(
                                   command.RedirectUri,
                                   cancellationToken)
                               ?? throw new InvalidOperationException(
                                   $"No active managed OIDC client matched redirect URI '{command.RedirectUri}'.");
        var authorizeUri = new Uri(oidcOptions.Value.GetIssuerBaseUri(), "connect/authorize");
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

    private string BuildIssuerHostedReturnUrl(string returnUrl)
    {
        return new Uri(oidcOptions.Value.GetIssuerBaseUri(), returnUrl.TrimStart('/')).AbsoluteUri;
    }

    private bool IsIssuerHostedRedirectUri(string redirectUri)
    {
        if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out var redirectUriValue))
        {
            return false;
        }

        var issuerBaseUri = oidcOptions.Value.GetIssuerBaseUri();
        var hostedCallbackBasePath = redirectUriValue.AbsolutePath.EndsWith("/auth/callback", StringComparison.OrdinalIgnoreCase)
            ? redirectUriValue.AbsolutePath[..^"/auth/callback".Length]
            : redirectUriValue.AbsolutePath;

        return string.Equals(redirectUriValue.Scheme, issuerBaseUri.Scheme, StringComparison.OrdinalIgnoreCase)
               && string.Equals(redirectUriValue.Host, issuerBaseUri.Host, StringComparison.OrdinalIgnoreCase)
               && redirectUriValue.Port == issuerBaseUri.Port
               && string.Equals(
                   TrimTrailingSlash(hostedCallbackBasePath),
                   TrimTrailingSlash(issuerBaseUri.AbsolutePath),
                   StringComparison.OrdinalIgnoreCase);
    }

    private string BuildIssuerCommandUrl(string relativePath, string token)
    {
        var commandUri = new Uri(oidcOptions.Value.GetIssuerBaseUri(), relativePath);
        var query = new QueryBuilder
        {
            { "command", token }
        };

        return new UriBuilder(commandUri)
        {
            Query = query.ToQueryString().Value?.TrimStart('?') ?? string.Empty
        }.Uri.AbsoluteUri;
    }

    private async Task<byte[]> SignAsync(
        byte[] payloadBytes,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        var managedClient = await managedOidcClientResolver.ResolveClientByRedirectUriAsync(
            redirectUri,
            cancellationToken);
        var clientSecret = managedClient?.ClientSecret;
        if (string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new InvalidOperationException("OIDC first-party client secret is required.");
        }

        return HMACSHA256.HashData(Encoding.UTF8.GetBytes(clientSecret), payloadBytes);
    }

    private async Task<string> ProtectAsync(
        ImpersonationBridgeCommand command,
        CancellationToken cancellationToken)
    {
        var payloadBytes = JsonSerializer.SerializeToUtf8Bytes(command, SerializerOptions);
        var signatureBytes = await SignAsync(payloadBytes, command.RedirectUri, cancellationToken);

        return $"{Base64UrlTextEncoder.Encode(payloadBytes)}.{Base64UrlTextEncoder.Encode(signatureBytes)}";
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

    private static string TrimTrailingSlash(string path)
    {
        var trimmedPath = path.Trim();
        if (trimmedPath.Length == 0 || trimmedPath == "/")
        {
            return "/";
        }

        return trimmedPath.TrimEnd('/');
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
