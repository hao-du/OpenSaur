using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Features.PermissionScopes.GetPermissionScopes;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;

namespace OpenSaur.Identity.Web.Features.PermissionScopes;

public static class PermissionScopeEndpoints
{
    public static IEndpointRouteBuilder MapPermissionScopeEndpoints(this IEndpointRouteBuilder app)
    {
        var permissionScopes = app.MapGroup("/api/permission-scope")
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequirePermission(PermissionCode.Administrator_CanManage);

        permissionScopes.MapGet("/get", GetPermissionScopesHandler.HandleAsync);

        return app;
    }
}
