using OpenSaur.Zentry.Web.Features.Workspaces.CreateWorkspace;
using OpenSaur.Zentry.Web.Features.Workspaces.EditWorkspace;
using OpenSaur.Zentry.Web.Features.Workspaces.GetAssignableRoles;
using OpenSaur.Zentry.Web.Features.Workspaces.GetUsersForImpersonationByWorkspaceId;
using OpenSaur.Zentry.Web.Features.Workspaces.GetWorkspaceById;
using OpenSaur.Zentry.Web.Features.Workspaces.GetWorkspaces;
using OpenSaur.Zentry.Web.Infrastructure.Auth;

namespace OpenSaur.Zentry.Web.Features.Workspaces;

public static class WorkspaceEndpoints
{
    public static IEndpointRouteBuilder MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
    {
        var workspaces = app.MapGroup("/api/workspace")
            .RequireAuthorization(AppAuthorization.SuperAdminOnlyPolicyName);

        workspaces.MapGet("/get", GetWorkspacesHandler.HandleAsync);
        workspaces.MapGet("/getbyid/{id:guid}", GetWorkspaceByIdHandler.HandleAsync);
        workspaces.MapGet("/impersonation/users/{workspaceId:guid}", GetUsersForImpersonationByWorkspaceIdHandler.HandleAsync);
        workspaces.MapGet("/roles", GetAssignableRolesHandler.HandleAsync);
        workspaces.MapPost("/create", CreateWorkspaceHandler.HandleAsync);
        workspaces.MapPut("/edit", EditWorkspaceHandler.HandleAsync);

        return app;
    }
}
