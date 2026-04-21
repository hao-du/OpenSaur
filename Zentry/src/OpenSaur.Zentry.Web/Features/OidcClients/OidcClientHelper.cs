using System.Text.Json;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.OidcClients;

internal static class OidcClientHelper
{
    public static void ApplyDescriptorConfiguration(
        OpenIddictApplicationDescriptor descriptor,
        string clientType,
        IEnumerable<string> redirectUris,
        IEnumerable<string> postLogoutRedirectUris,
        string scope)
    {
        descriptor.RedirectUris.Clear();
        descriptor.PostLogoutRedirectUris.Clear();
        descriptor.Permissions.Clear();
        descriptor.Requirements.Clear();
        descriptor.ConsentType = OpenIddictConstants.ConsentTypes.Implicit;

        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Authorization);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Token);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.RefreshToken);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.ResponseTypes.Code);

        if (string.Equals(clientType, OpenIddictConstants.ClientTypes.Public, StringComparison.Ordinal))
        {
            descriptor.Requirements.Add(OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange);
        }

        foreach (var scopeValue in scope
                     .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                     .Distinct(StringComparer.Ordinal))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + scopeValue);
        }

        foreach (var redirectUri in redirectUris
                     .Select(uri => uri.Trim())
                     .Where(uri => uri.Length > 0)
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            descriptor.RedirectUris.Add(new Uri(redirectUri, UriKind.Absolute));
        }

        foreach (var postLogoutRedirectUri in postLogoutRedirectUris
                     .Select(uri => uri.Trim())
                     .Where(uri => uri.Length > 0)
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.PostLogoutRedirectUris.Add(new Uri(postLogoutRedirectUri, UriKind.Absolute));
        }
    }

    public static string GetScope(string? permissionsJson)
    {
        return string.Join(
            ' ',
            StringHelper.ParseStringArray(permissionsJson)
                .Where(permission => permission.StartsWith(OpenIddictConstants.Permissions.Prefixes.Scope, StringComparison.Ordinal))
                .Select(permission => permission[OpenIddictConstants.Permissions.Prefixes.Scope.Length..])
                .Distinct(StringComparer.Ordinal)
                .OrderBy(permission => permission, StringComparer.Ordinal));
    }
}
