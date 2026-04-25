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
            .RequireAuthorization(SuperAdminAuthorization.PolicyName);

        roles.MapGet("/get", GetRolesHandler.HandleAsync);
        roles.MapGet("/getbyid/{id:guid}", GetRoleByIdHandler.HandleAsync);
        roles.MapPost("/create", CreateRoleHandler.HandleAsync);
        roles.MapPut("/edit", EditRoleHandler.HandleAsync);

        return app;
    }
}
