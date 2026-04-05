using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenSaur.Identity.Web.Domain.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class ManagedOidcClientResolver(
    ApplicationDbContext dbContext,
    IOptions<OidcOptions> oidcOptionsAccessor)
{
    public async Task<string?> BuildCurrentPostLogoutRedirectUriAsync(
        HttpRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentClient = await ResolveCurrentClientAsync(request, cancellationToken);
        if (currentClient is null)
        {
            return null;
        }

        var currentOrigin = NormalizeOrigin(oidcOptionsAccessor.Value.GetCurrentAppBaseUri(request));
        return BuildPostLogoutRedirectUri(currentClient, currentOrigin);
    }

    public async Task<string?> BuildCurrentRedirectUriAsync(
        HttpRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentClient = await ResolveCurrentClientAsync(request, cancellationToken);
        if (currentClient is null)
        {
            return null;
        }

        var currentOrigin = NormalizeOrigin(oidcOptionsAccessor.Value.GetCurrentAppBaseUri(request));
        return BuildRedirectUri(currentClient, currentOrigin);
    }

    public async Task<IReadOnlyList<ManagedOidcClientRuntime>> GetClientsAsync(
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.OidcClients
            .AsNoTracking()
            .Include(client => client.Origins)
            .AsQueryable();

        if (activeOnly)
        {
            query = query.Where(client => client.IsActive);
        }

        var clients = await query
            .OrderBy(client => client.DisplayName)
            .ThenBy(client => client.ClientId)
            .ToListAsync(cancellationToken);

        return clients.Select(MapToRuntime).ToArray();
    }

    public async Task<ManagedOidcClientRuntime?> ResolveCurrentClientAsync(
        HttpRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentAppBaseUri = oidcOptionsAccessor.Value.GetCurrentAppBaseUri(request);
        var currentOrigin = NormalizeOrigin(currentAppBaseUri);
        var currentAppPathBase = NormalizePathBase(currentAppBaseUri.AbsolutePath);

        var client = await ResolveConfiguredClientEntityAsync(cancellationToken);
        if (client is null
            || !string.Equals(client.AppPathBase, currentAppPathBase, StringComparison.OrdinalIgnoreCase)
            || !client.Origins.Any(origin => string.Equals(origin.BaseUri, currentOrigin, StringComparison.OrdinalIgnoreCase)))
        {
            return null;
        }

        return MapToRuntime(client);
    }

    public async Task<ManagedOidcClientRuntime?> ResolveClientByRedirectUriAsync(
        string redirectUri,
        CancellationToken cancellationToken = default)
    {
        var client = await ResolveConfiguredClientEntityAsync(cancellationToken);
        if (client is null)
        {
            return null;
        }

        if (!TryExtractClientLocatorFromRedirectUri(
                redirectUri,
                client.CallbackPath,
                out var origin,
                out var appPathBase))
        {
            return null;
        }

        if (!string.Equals(client.AppPathBase, appPathBase, StringComparison.OrdinalIgnoreCase)
            || !client.Origins.Any(item => string.Equals(item.BaseUri, origin, StringComparison.OrdinalIgnoreCase)))
        {
            return null;
        }

        return MapToRuntime(client);
    }

    public string BuildRedirectUri(ManagedOidcClientRuntime client, string origin)
    {
        return CombineAbsoluteUri(origin, client.AppPathBase, client.CallbackPath);
    }

    public string BuildPostLogoutRedirectUri(ManagedOidcClientRuntime client, string origin)
    {
        return CombineAbsoluteUri(origin, client.AppPathBase, client.PostLogoutPath);
    }

    private ManagedOidcClientRuntime MapToRuntime(OidcClient client)
    {
        var activeOrigins = client.Origins
            .Where(origin => origin.IsActive)
            .Select(origin => origin.BaseUri)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(origin => origin, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new ManagedOidcClientRuntime(
            client.Id,
            client.ClientId,
            client.ClientSecret,
            client.DisplayName,
            client.Description,
            client.Scope,
            client.AppPathBase,
            client.CallbackPath,
            client.PostLogoutPath,
            activeOrigins,
            activeOrigins
                .Select(
                    origin => CombineAbsoluteUri(
                        origin,
                        client.AppPathBase,
                        client.CallbackPath))
                .ToArray(),
            activeOrigins
                .Select(
                    origin => CombineAbsoluteUri(
                        origin,
                        client.AppPathBase,
                        client.PostLogoutPath))
                .ToArray(),
            client.IsActive);
    }

    private async Task<OidcClient?> ResolveConfiguredClientEntityAsync(CancellationToken cancellationToken)
    {
        var currentClient = oidcOptionsAccessor.Value.CurrentClient;
        var configuredClientId = currentClient.ClientId.Trim();
        if (configuredClientId.Length == 0)
        {
            return null;
        }

        var configuredClientSecret = currentClient.ClientSecret.Trim();

        return await dbContext.OidcClients
            .AsNoTracking()
            .Include(candidate => candidate.Origins.Where(origin => origin.IsActive))
            .SingleOrDefaultAsync(
                candidate => candidate.IsActive
                             && candidate.ClientId == configuredClientId
                             && candidate.ClientSecret == configuredClientSecret,
                cancellationToken);
    }
    public static string NormalizeOrigin(string origin)
    {
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
        {
            throw new InvalidOperationException($"OIDC client origin '{origin}' is invalid.");
        }

        if (!string.IsNullOrEmpty(originUri.AbsolutePath)
            && originUri.AbsolutePath != "/")
        {
            throw new InvalidOperationException(
                $"OIDC client origin '{originUri.AbsoluteUri}' must not contain a path segment.");
        }

        return NormalizeOrigin(originUri);
    }

    public static string NormalizeOrigin(Uri absoluteUri)
    {
        return new UriBuilder(absoluteUri.Scheme, absoluteUri.Host, absoluteUri.IsDefaultPort ? -1 : absoluteUri.Port)
        {
            Path = "/"
        }.Uri.AbsoluteUri;
    }

    public static string NormalizePathBase(string? pathBase)
    {
        var trimmedPath = pathBase?.Trim() ?? string.Empty;
        if (trimmedPath.Length == 0 || trimmedPath == "/")
        {
            return "/";
        }

        return trimmedPath.StartsWith("/", StringComparison.Ordinal)
            ? trimmedPath.TrimEnd('/')
            : $"/{trimmedPath.TrimEnd('/')}";
    }

    public static string CombineAbsoluteUri(string origin, string appPathBase, string suffixPath)
    {
        var normalizedOrigin = NormalizeOrigin(origin);
        var normalizedAppPathBase = NormalizePathBase(appPathBase);
        var normalizedSuffix = NormalizeRelativePath(suffixPath);
        var combinedPath = CombinePathSegments(normalizedAppPathBase, normalizedSuffix);

        return new Uri(new Uri(normalizedOrigin, UriKind.Absolute), combinedPath.TrimStart('/')).AbsoluteUri;
    }

    public static bool TryExtractClientLocatorFromRedirectUri(
        string redirectUri,
        string callbackPath,
        out string origin,
        out string appPathBase)
    {
        origin = string.Empty;
        appPathBase = "/";

        if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out var redirectUriValue))
        {
            return false;
        }

        var normalizedCallbackPath = NormalizeRelativePath(callbackPath);
        if (!redirectUriValue.AbsolutePath.EndsWith(normalizedCallbackPath, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var candidateAppPathBase = redirectUriValue.AbsolutePath[..^normalizedCallbackPath.Length];
        origin = NormalizeOrigin(redirectUriValue);
        appPathBase = NormalizePathBase(candidateAppPathBase);
        return true;
    }

    public static string NormalizeRelativePath(string path)
    {
        var trimmedPath = path.Trim();
        if (trimmedPath.Length == 0 || trimmedPath == "/")
        {
            return "/";
        }

        return trimmedPath.StartsWith("/", StringComparison.Ordinal)
            ? trimmedPath.TrimEnd('/')
            : $"/{trimmedPath.TrimEnd('/')}";
    }

    public static string CombinePathSegments(string? left, string? right)
    {
        var normalizedLeft = NormalizePathBase(left);
        var normalizedRight = NormalizeRelativePath(right ?? "/");

        return (normalizedLeft, normalizedRight) switch
        {
            ("/", "/") => "/",
            ("/", _) => normalizedRight,
            (_, "/") => normalizedLeft,
            _ => $"{normalizedLeft}{normalizedRight}"
        };
    }
}
