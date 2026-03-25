using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace;
using OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace;
using OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaceById;
using OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaces;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

namespace OpenSaur.Identity.Web.Features.Workspaces;

public static class WorkspaceEndpoints
{
    public static IEndpointRouteBuilder MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
    {
        var workspaces = app.MapGroup("/api/workspace")
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequirePermission(PermissionCode.Administrator_CanManage)
            .RequireWorkspaceAccess();

        workspaces.MapGet("/get", GetWorkspacesHandler.HandleAsync);
        workspaces.MapGet("/getbyid/{id:guid}", GetWorkspaceByIdHandler.HandleAsync);
        workspaces.MapPost("/create", CreateWorkspaceHandler.HandleAsync)
            .RequireIdempotency()
            .RequireWorkspaceAccess(restrictToSuperAdministrator: true);
        workspaces.MapPut("/edit", EditWorkspaceHandler.HandleAsync)
            .RequireIdempotency()
            .RequireWorkspaceAccess(restrictToSuperAdministrator: true);

        return app;
    }
}
