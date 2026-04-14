using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Domain.Identity;

namespace OpenSaur.CoreGate.Web.Infrastructure.Security;

internal static class AuthSessionPrincipalFactory
{
    public static ClaimsPrincipal Create(
        ApplicationUser user,
        IEnumerable<string> normalizedRoles,
        IEnumerable<string> permissionCodes,
        IEnumerable<string> scopes)
    {
        var identity = new ClaimsIdentity(
            TokenValidationParameters.DefaultAuthenticationType,
            ApplicationClaimTypes.Name,
            ApplicationClaimTypes.Role);

        identity.AddClaim(new Claim(ApplicationClaimTypes.Subject, user.Id.ToString()));
        identity.AddClaim(new Claim(ApplicationClaimTypes.Name, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ApplicationClaimTypes.PreferredUserName, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ApplicationClaimTypes.WorkspaceId, user.WorkspaceId.ToString()));
        identity.AddClaim(new Claim(
            ApplicationClaimTypes.RequirePasswordChange,
            user.RequirePasswordChange.ToString().ToLowerInvariant()));

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Email, user.Email));
        }

        foreach (var role in normalizedRoles.Where(static role => !string.IsNullOrWhiteSpace(role)).Distinct(StringComparer.Ordinal))
        {
            identity.AddClaim(new Claim(ApplicationClaimTypes.Role, role));
        }

        foreach (var permissionCode in permissionCodes.Where(static code => !string.IsNullOrWhiteSpace(code)).Distinct(StringComparer.Ordinal))
        {
            identity.AddClaim(new Claim(ApplicationClaimTypes.Permissions, permissionCode));
        }

        var principal = new ClaimsPrincipal(identity);
        var scopeArray = scopes
            .Where(static scope => !string.IsNullOrWhiteSpace(scope))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        principal.SetScopes(scopeArray);

        if (scopeArray.Contains(ScopeConstants.Api, StringComparer.Ordinal))
        {
            principal.SetResources(ResourceConstants.Api);
        }

        principal.SetDestinations(static claim => claim.Type switch
        {
            ApplicationClaimTypes.Subject => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ApplicationClaimTypes.Name or ApplicationClaimTypes.PreferredUserName
                when claim.Subject is ClaimsIdentity profileIdentity
                     && profileIdentity.HasScope(OpenIddictConstants.Scopes.Profile)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            OpenIddictConstants.Claims.Email
                when claim.Subject is ClaimsIdentity emailIdentity
                     && emailIdentity.HasScope(OpenIddictConstants.Scopes.Email)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ApplicationClaimTypes.Role
                when claim.Subject is ClaimsIdentity roleIdentity
                     && roleIdentity.HasScope(OpenIddictConstants.Scopes.Roles)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ApplicationClaimTypes.Permissions
                when claim.Subject is ClaimsIdentity permissionIdentity
                     && permissionIdentity.HasScope(ScopeConstants.Api)
                => [OpenIddictConstants.Destinations.AccessToken],
            ApplicationClaimTypes.WorkspaceId or ApplicationClaimTypes.RequirePasswordChange
                => [OpenIddictConstants.Destinations.AccessToken],
            _ => []
        });

        return principal;
    }
}
