using Microsoft.AspNetCore.Authorization;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Requirements;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;

public static class PermissionEndpointConventionBuilderExtensions
{
    public static TBuilder RequirePermission<TBuilder>(
        this TBuilder builder,
        params string[] requiredPermissions)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        if (requiredPermissions.Length == 0)
        {
            throw new ArgumentException("At least one permission is required.", nameof(requiredPermissions));
        }

        builder.RequireAuthorization(
            policy => policy.AddRequirements(new PermissionAuthorizationRequirement(requiredPermissions)));

        return builder;
    }
}
