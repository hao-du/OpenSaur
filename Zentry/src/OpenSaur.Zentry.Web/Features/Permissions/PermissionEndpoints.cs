using OpenSaur.Zentry.Web.Features.Permissions.GetPermissions;
using OpenSaur.Zentry.Web.Infrastructure.Auth;

namespace OpenSaur.Zentry.Web.Features.Permissions;

public static class PermissionEndpoints
{
    public static IEndpointRouteBuilder MapPermissionEndpoints(this IEndpointRouteBuilder app)
    {
        var permissions = app.MapGroup("/api/permission")
            .RequireAuthorization(SuperAdminAuthorization.PolicyName);

        permissions.MapGet("/get", GetPermissionsHandler.HandleAsync);

        return app;
    }
}
