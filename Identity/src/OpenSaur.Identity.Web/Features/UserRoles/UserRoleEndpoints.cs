using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole;
using OpenSaur.Identity.Web.Features.UserRoles.EditUserRole;
using OpenSaur.Identity.Web.Features.UserRoles.GetUserRoles;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

namespace OpenSaur.Identity.Web.Features.UserRoles;

public static class UserRoleEndpoints
{
    public static IEndpointRouteBuilder MapUserRoleEndpoints(this IEndpointRouteBuilder app)
    {
        var userRoles = app.MapGroup("/api/user-role")
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequirePermission(PermissionCode.Administrator_CanManage)
            .RequireWorkspaceAccess();

        userRoles.MapGet("/get", GetUserRolesHandler.HandleAsync);
        userRoles.MapPost("/create", CreateUserRoleHandler.HandleAsync)
            .RequireIdempotency();
        userRoles.MapPut("/edit", EditUserRoleHandler.HandleAsync)
            .RequireIdempotency();

        return app;
    }
}
