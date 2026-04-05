using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth;

internal static class AuthSessionPrincipalFactory
{
    public static ClaimsPrincipal Create(
        ApplicationUser user,
        IEnumerable<string> normalizedRoles,
        IEnumerable<string> permissionCodes,
        IEnumerable<string> scopes,
        Guid? workspaceOverrideId = null,
        bool isImpersonating = false,
        Guid? impersonationOriginalUserId = null)
    {
        var identity = new ClaimsIdentity(
            TokenValidationParameters.DefaultAuthenticationType,
            ApplicationClaimTypes.Name,
            ApplicationClaimTypes.Role);
        var workspaceId = workspaceOverrideId ?? user.WorkspaceId;

        identity.AddClaim(new Claim(ApplicationClaimTypes.Subject, user.Id.ToString()));
        identity.AddClaim(new Claim(ApplicationClaimTypes.Name, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ApplicationClaimTypes.PreferredUserName, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ApplicationClaimTypes.WorkspaceId, workspaceId.ToString()));
        identity.AddClaim(new Claim(
            ApplicationClaimTypes.RequirePasswordChange,
            user.RequirePasswordChange.ToString().ToLowerInvariant()));

        if (isImpersonating)
        {
            identity.AddClaim(new Claim(ApplicationClaimTypes.ImpersonationActive, bool.TrueString.ToLowerInvariant()));
        }

        if (impersonationOriginalUserId.HasValue)
        {
            identity.AddClaim(new Claim(
                ApplicationClaimTypes.ImpersonationOriginalUserId,
                impersonationOriginalUserId.Value.ToString()));
        }

        if (workspaceOverrideId.HasValue)
        {
            identity.AddClaim(new Claim(ApplicationClaimTypes.ImpersonationWorkspaceId, workspaceOverrideId.Value.ToString()));
        }

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Email, user.Email));
        }

        foreach (var role in normalizedRoles
                     .Where(static role => !string.IsNullOrWhiteSpace(role))
                     .Distinct(StringComparer.Ordinal))
        {
            identity.AddClaim(new Claim(ApplicationClaimTypes.Role, role));
        }

        foreach (var permissionCode in permissionCodes
                     .Where(static permissionCode => !string.IsNullOrWhiteSpace(permissionCode))
                     .Distinct(StringComparer.Ordinal))
        {
            identity.AddClaim(new Claim(ApplicationClaimTypes.Permissions, permissionCode));
        }

        var principal = new ClaimsPrincipal(identity);
        var scopeArray = scopes
            .Where(static scope => !string.IsNullOrWhiteSpace(scope))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        principal.SetScopes(scopeArray);

        if (scopeArray.Contains("api", StringComparer.Ordinal))
        {
            principal.SetResources("api");
        }

        principal.SetDestinations(static claim => claim.Type switch
        {
            ApplicationClaimTypes.Subject
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
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
                     && permissionIdentity.HasScope("api")
                => [OpenIddictConstants.Destinations.AccessToken],
            ApplicationClaimTypes.WorkspaceId
                or ApplicationClaimTypes.RequirePasswordChange
                or ApplicationClaimTypes.ImpersonationActive
                or ApplicationClaimTypes.ImpersonationOriginalUserId
                or ApplicationClaimTypes.ImpersonationWorkspaceId
                => [OpenIddictConstants.Destinations.AccessToken],
            _ => []
        });

        return principal;
    }
}
