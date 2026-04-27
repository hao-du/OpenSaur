using OpenSaur.Zentry.Web.Features.Roles.CreateRole;
using OpenSaur.Zentry.Web.Features.Roles.EditRole;
using OpenSaur.Zentry.Web.Features.Roles.GetRoleById;
using OpenSaur.Zentry.Web.Features.Roles.GetRoles;
using OpenSaur.Zentry.Web.Infrastructure.Auth;

namespace OpenSaur.Zentry.Web.Features.Roles;

public static class RoleEndpoints
{
    public static IEndpointRouteBuilder MapRoleEndpoints(this IEndpointRouteBuilder app)
    {
        var roles = app.MapGroup("/api/role")
            .RequireAuthorization();

        roles.MapGet("/get", GetRolesHandler.HandleAsync)
            .RequireAuthorization(AppAuthorization.AdminCanManageOrSuperAdminPolicyName);
        roles.MapGet("/getbyid/{id:guid}", GetRoleByIdHandler.HandleAsync)
            .RequireAuthorization(AppAuthorization.AdminCanManageOrSuperAdminPolicyName);
        roles.MapPost("/create", CreateRoleHandler.HandleAsync)
            .RequireAuthorization(AppAuthorization.SuperAdminOnlyPolicyName);
        roles.MapPut("/edit", EditRoleHandler.HandleAsync)
            .RequireAuthorization(AppAuthorization.SuperAdminOnlyPolicyName);

        return app;
    }
}
