using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Infrastructure.Caching;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class ScopeValidationService(
    IOpenIddictApplicationManager applicationManager,
    ICacheService cacheService)
{
    public async Task<ScopeValidationResult> ValidateScopesAsync(
        object application,
        IEnumerable<string> requestedScopes,
        CancellationToken cancellationToken = default)
    {
        var scopeList = requestedScopes
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (scopeList.Count == 0)
        {
            return ScopeValidationResult.Success();
        }

        var clientId = await applicationManager.GetClientIdAsync(application, cancellationToken) ?? string.Empty;
        var cacheKey = CacheKeys.ClientPermissions(clientId);

        var permissionsSet = await cacheService.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                var applicationPermissions = await applicationManager.GetPermissionsAsync(application, ct);
                return applicationPermissions.ToHashSet(StringComparer.Ordinal);
            },
            tags: [CacheKeys.Tags.Client(clientId)],
            cancellationToken: cancellationToken);

        foreach (var scope in scopeList)
        {
            var scopePermission = OpenIddictConstants.Permissions.Prefixes.Scope + scope;
            if (!permissionsSet.Contains(scopePermission))
            {
                return ScopeValidationResult.Failure(
                    scope,
                    $"The requested scope '{scope}' is invalid or not granted to this client application.");
            }
        }

        return ScopeValidationResult.Success();
    }
}

public sealed record ScopeValidationResult(
    bool Succeeded,
    string? InvalidScope = null,
    string? ErrorDescription = null)
{
    public static ScopeValidationResult Success() => new(true);
    public static ScopeValidationResult Failure(string invalidScope, string description) => new(false, invalidScope, description);
}
