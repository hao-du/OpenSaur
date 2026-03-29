using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.UserRoles.GetAvailableRoles;

public static class GetAvailableRolesHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        WorkspaceRoleRepository workspaceRoleRepository,
        CancellationToken cancellationToken)
    {
        var rolesResult = await workspaceRoleRepository.GetActiveWorkspaceRolesAsync(
            new GetActiveWorkspaceRolesRequest(currentUserContext.WorkspaceId),
            cancellationToken);

        return rolesResult.ToApiResult(
            response => response.Roles
                .Where(role => !SystemRoles.IsSuperAdministratorValue(role.NormalizedName ?? string.Empty))
                .Select(
                    role => new GetAvailableRolesResponse(
                        role.Id,
                        role.Name ?? string.Empty,
                        role.NormalizedName ?? string.Empty,
                        role.Description,
                        role.IsActive))
                .ToList());
    }
}
