using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.OidcClients;

internal static class OidcClientRequestNormalization
{
    public static string NormalizeAppPathBase(string pathBase)
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

    public static string NormalizeClientPath(string path)
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

    public static string[] NormalizeOrigins(IEnumerable<string> origins)
    {
        return origins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(NormalizeOrigin)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(origin => origin, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static async Task<Result?> EnsureClientIdAvailableAsync(
        ApplicationDbContext dbContext,
        string clientId,
        Guid? excludingOidcClientId,
        CancellationToken cancellationToken)
    {
        var clientIdInUse = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .AsNoTracking()
            .AnyAsync(
                client => client.ClientId == clientId
                          && (!excludingOidcClientId.HasValue || client.Id != excludingOidcClientId.Value),
                cancellationToken);
        if (!clientIdInUse)
        {
            return null;
        }

        return Result.Conflict(
            "Client id already exists.",
            "Another managed OIDC client already uses the provided client id.");
    }

    public static async Task<Result?> EnsureOriginsAvailableAsync(
        ApplicationDbContext dbContext,
        string appPathBase,
        IEnumerable<string> origins,
        Guid? excludingOidcClientId,
        CancellationToken cancellationToken)
    {
        var normalizedOrigins = origins.ToArray();
        var applications = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .AsNoTracking()
            .Where(client => !excludingOidcClientId.HasValue || client.Id != excludingOidcClientId.Value)
            .ToListAsync(cancellationToken);
        var conflictingClient = applications
            .Select(
                application => new
                {
                    Application = application,
                    Metadata = OpenIddictApplicationMetadataMapper.Read(application)
                })
            .Where(candidate => candidate.Metadata.IsActive
                                && string.Equals(candidate.Metadata.AppPathBase, appPathBase, StringComparison.OrdinalIgnoreCase)
                                && candidate.Metadata.Origins.Any(origin => normalizedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)))
            .Select(
                candidate => new
                {
                    candidate.Application.ClientId,
                    candidate.Application.DisplayName
                })
            .FirstOrDefault();
        if (conflictingClient is null)
        {
            return null;
        }

        return Result.Conflict(
            "Client origin already exists.",
            $"Managed OIDC client '{conflictingClient.DisplayName}' already owns one of the provided origins for '{appPathBase}'.");
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

    public static string CombineAbsoluteUri(string origin, string appPathBase, string suffixPath)
    {
        var normalizedOrigin = NormalizeOrigin(origin);
        var normalizedAppPathBase = NormalizeAppPathBase(appPathBase);
        var normalizedSuffix = NormalizeClientPath(suffixPath);
        var combinedPath = CombinePathSegments(normalizedAppPathBase, normalizedSuffix);

        return new Uri(new Uri(normalizedOrigin, UriKind.Absolute), combinedPath.TrimStart('/')).AbsoluteUri;
    }

    public static string CombinePathSegments(string? left, string? right)
    {
        var normalizedLeft = NormalizeAppPathBase(left ?? "/");
        var normalizedRight = NormalizeClientPath(right ?? "/");

        return (normalizedLeft, normalizedRight) switch
        {
            ("/", "/") => "/",
            ("/", _) => normalizedRight,
            (_, "/") => normalizedLeft,
            _ => $"{normalizedLeft}{normalizedRight}"
        };
    }
}
