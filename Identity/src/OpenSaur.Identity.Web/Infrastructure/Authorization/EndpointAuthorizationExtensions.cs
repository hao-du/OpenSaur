using Microsoft.AspNetCore.Authorization;
using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization;

public static class EndpointAuthorizationExtensions
{
    public static TBuilder RequirePermission<TBuilder>(
        this TBuilder builder,
        params PermissionCode[] requiredPermissions)
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

    public static TBuilder RequireWorkspaceAccess<TBuilder>(
        this TBuilder builder,
        bool restrictToSuperAdministrator = false)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.AddEndpointFilterFactory(
            (_, next) =>
            {
                var filter = new WorkspaceAccessFilter(restrictToSuperAdministrator);
                return invocationContext => filter.InvokeAsync(invocationContext, next);
            });

        return builder;
    }
}
