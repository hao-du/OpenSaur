using System.Text.Json;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.OidcClients;

internal static class OidcClientHelper
{
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
