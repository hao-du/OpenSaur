using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Oidc;

namespace OpenSaur.Identity.Web.Features.OidcClients;

internal static class OidcClientRequestNormalization
{
    public static string NormalizeAppPathBase(string pathBase)
    {
        return ManagedOidcClientResolver.NormalizePathBase(pathBase);
    }

    public static string NormalizeClientPath(string path)
    {
        return ManagedOidcClientResolver.NormalizeRelativePath(path);
    }

    public static string[] NormalizeOrigins(IEnumerable<string> origins)
    {
        return origins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(ManagedOidcClientResolver.NormalizeOrigin)
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
        var clientIdInUse = await dbContext.OidcClients
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
        var conflictingClient = await dbContext.OidcClients
            .AsNoTracking()
            .Where(client => client.IsActive
                             && (!excludingOidcClientId.HasValue || client.Id != excludingOidcClientId.Value)
                             && client.AppPathBase == appPathBase)
            .Where(client => client.Origins.Any(origin => origin.IsActive && normalizedOrigins.Contains(origin.BaseUri)))
            .Select(client => new { client.ClientId, client.DisplayName })
            .FirstOrDefaultAsync(cancellationToken);
        if (conflictingClient is null)
        {
            return null;
        }

        return Result.Conflict(
            "Client origin already exists.",
            $"Managed OIDC client '{conflictingClient.DisplayName}' already owns one of the provided origins for '{appPathBase}'.");
    }

    public static List<OidcClientOrigin> CreateOrigins(IEnumerable<string> origins, Guid createdBy)
    {
        return origins
            .Select(
                origin => new OidcClientOrigin
                {
                    BaseUri = origin,
                    CreatedBy = createdBy,
                    Description = "Managed OIDC client origin.",
                    IsActive = true
                })
            .ToList();
    }
}
