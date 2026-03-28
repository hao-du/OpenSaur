using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Features.Roles.CreateRole;
using OpenSaur.Identity.Web.Features.Roles.EditRole;
using OpenSaur.Identity.Web.Features.Roles.GetRoleById;
using OpenSaur.Identity.Web.Features.Roles.GetRoles;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

namespace OpenSaur.Identity.Web.Features.Roles;

public static class RoleEndpoints
{
    public static IEndpointRouteBuilder MapRoleEndpoints(this IEndpointRouteBuilder app)
    {
        var roles = app.MapGroup("/api/role")
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequirePermission(PermissionCode.Administrator_CanManage);

        roles.MapGet("/get", GetRolesHandler.HandleAsync);
        roles.MapGet("/getbyid/{id:guid}", GetRoleByIdHandler.HandleAsync);
        roles.MapPost("/create", CreateRoleHandler.HandleAsync)
            .RequireIdempotency()
            .RequireWorkspaceAccess(
                restrictToSuperAdministrator: true,
                allowImpersonatedSuperAdministrator: true);
        roles.MapPut("/edit", EditRoleHandler.HandleAsync)
            .RequireIdempotency()
            .RequireWorkspaceAccess(
                restrictToSuperAdministrator: true,
                allowImpersonatedSuperAdministrator: true);

        return app;
    }
}
