using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaces;

public static class GetWorkspacesHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        WorkspaceRepository workspaceRepository,
        CancellationToken cancellationToken)
    {
        var workspacesResult = await workspaceRepository.GetAccessibleWorkspacesAsync(
            new GetAccessibleWorkspacesRequest(currentUserContext),
            cancellationToken);

        return workspacesResult.ToApiResult(
            response => response.Workspaces.Select(
                static workspace => new GetWorkspacesResponse(
                    workspace.Id,
                    workspace.Name,
                    workspace.Description,
                    workspace.IsActive,
                    workspace.WorkspaceRoles
                        .Where(workspaceRole => workspaceRole.IsActive)
                        .Select(workspaceRole => workspaceRole.RoleId)
                        .ToList(),
                    workspace.MaxActiveUsers))
                .ToList());
    }
}
