using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Features.Permissions.GetPermissionById;
using OpenSaur.Identity.Web.Features.Permissions.GetPermissions;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;

namespace OpenSaur.Identity.Web.Features.Permissions;

public static class PermissionEndpoints
{
    public static IEndpointRouteBuilder MapPermissionEndpoints(this IEndpointRouteBuilder app)
    {
        var permissions = app.MapGroup("/api/permission")
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequirePermission(PermissionCode.Administrator_CanManage);

        permissions.MapGet("/get", GetPermissionsHandler.HandleAsync);
        permissions.MapGet("/getbyid/{code}", GetPermissionByIdHandler.HandleAsync);

        return app;
    }
}
