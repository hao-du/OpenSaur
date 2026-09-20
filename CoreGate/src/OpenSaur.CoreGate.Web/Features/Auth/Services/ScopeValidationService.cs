using OpenIddict.Abstractions;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class ScopeValidationService(
    IOpenIddictApplicationManager applicationManager)
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

        var applicationPermissions = await applicationManager.GetPermissionsAsync(application, cancellationToken);
        var permissionsSet = applicationPermissions.ToHashSet(StringComparer.Ordinal);

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
