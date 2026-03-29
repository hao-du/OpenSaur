using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaceById;

public static class GetWorkspaceByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        CurrentUserContext currentUserContext,
        WorkspaceRepository workspaceRepository,
        CancellationToken cancellationToken)
    {
        var workspaceResult = await workspaceRepository.GetAccessibleWorkspaceByIdAsync(
            new GetAccessibleWorkspaceByIdRequest(id, currentUserContext),
            cancellationToken);

        return workspaceResult.ToApiResult(
            response => new GetWorkspaceByIdResponse(
                response.Workspace.Id,
                response.Workspace.Name,
                response.Workspace.Description,
                response.Workspace.IsActive,
                response.Workspace.WorkspaceRoles
                    .Where(workspaceRole => workspaceRole.IsActive)
                    .Select(workspaceRole => workspaceRole.RoleId)
                    .ToList(),
                response.Workspace.MaxActiveUsers));
    }
}
