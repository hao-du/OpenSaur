using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Domain.Workspaces;
using System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Infrastructure.Security;

internal static class ClaimPrincipalHelpers
{
    public static string? GetUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.Subject)
               ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
    }
    public static string? GetWorkspaceId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.WorkspaceId);
    }

    public static string? GetImpersonatedUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.ImpersonatedUserId);
    }

    public static void AddOrReplaceClaim(ClaimsPrincipal principal, string claimType, string? claimValue)
    {
        if (principal.Identity is not ClaimsIdentity identity)
        {
            return;
        }

        foreach (var claim in identity.FindAll(claimType).ToArray())
        {
            identity.RemoveClaim(claim);
        }

        if (!string.IsNullOrWhiteSpace(claimValue))
        {
            identity.AddClaim(new Claim(claimType, claimValue));
        }
    }

    public static ClaimsPrincipal Create(
        ApplicationUser user,
        IEnumerable<string> normalizedRoles,
        IEnumerable<string> permissionCodes,
        IEnumerable<string> scopes,
        string? impersonationOriginalUserId = null,
        Workspace? assignedWorkspace = null)
    {
        var identity = new ClaimsIdentity(
            TokenValidationParameters.DefaultAuthenticationType,
            ClaimTypes.Name,
            ClaimTypes.Role);

        identity.AddClaim(new Claim(ClaimTypes.Subject, user.Id.ToString()));
        identity.AddClaim(new Claim(ClaimTypes.Name, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ClaimTypes.PreferredUserName, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ClaimTypes.WorkspaceId, assignedWorkspace == null ? user.WorkspaceId.ToString() : assignedWorkspace.Id.ToString()));
        identity.AddClaim(new Claim(ClaimTypes.WorkspaceId, assignedWorkspace == null ? (user.Workspace == null ? user.WorkspaceId.ToString() : user.Workspace.Name) : assignedWorkspace.Name));
        identity.AddClaim(new Claim(
            ClaimTypes.RequirePasswordChange,
            user.RequirePasswordChange.ToString().ToLowerInvariant()));

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Email, user.Email));
        }

        foreach (var role in normalizedRoles.Where(static role => !string.IsNullOrWhiteSpace(role)).Distinct(StringComparer.Ordinal))
        {
            identity.AddClaim(new Claim(ClaimTypes.Role, role));
        }

        foreach (var permissionCode in permissionCodes.Where(static code => !string.IsNullOrWhiteSpace(code)).Distinct(StringComparer.Ordinal))
        {
            identity.AddClaim(new Claim(ClaimTypes.Permissions, permissionCode));
        }

        if (!string.IsNullOrWhiteSpace(impersonationOriginalUserId))
        {
            identity.AddClaim(new Claim(ClaimTypes.ImpersonationOriginalUserId, impersonationOriginalUserId));
        }

        var principal = new ClaimsPrincipal(identity);
        var scopeArray = scopes
            .Where(static scope => !string.IsNullOrWhiteSpace(scope))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        principal.SetScopes(scopeArray);

        var scope = "api";
        if (scopeArray.Contains(scope, StringComparer.Ordinal))
        {
            principal.SetResources(scope);
        }

        principal.SetDestinations(static claim => claim.Type switch
        {
            ClaimTypes.Subject => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ClaimTypes.Name or ClaimTypes.PreferredUserName
                when claim.Subject is ClaimsIdentity profileIdentity
                     && profileIdentity.HasScope(OpenIddictConstants.Scopes.Profile)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            OpenIddictConstants.Claims.Email
                when claim.Subject is ClaimsIdentity emailIdentity
                     && emailIdentity.HasScope(OpenIddictConstants.Scopes.Email)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ClaimTypes.Role
                when claim.Subject is ClaimsIdentity roleIdentity
                     && roleIdentity.HasScope(OpenIddictConstants.Scopes.Roles)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ClaimTypes.Permissions
                when claim.Subject is ClaimsIdentity permissionIdentity
                     && permissionIdentity.HasScope("api")
                => [OpenIddictConstants.Destinations.AccessToken],
            ClaimTypes.ImpersonationOriginalUserId
                => [OpenIddictConstants.Destinations.AccessToken],
            ClaimTypes.WorkspaceId or ClaimTypes.RequirePasswordChange
                => [OpenIddictConstants.Destinations.AccessToken],
            _ => []
        });

        return principal;
    }
}
