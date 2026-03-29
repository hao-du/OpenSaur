using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.UserRoles.GetRoleCandidates;

public static class GetRoleCandidatesHandler
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
            response => response.Roles.Select(
                role => new
                {
                    Role = role,
                    NormalizedName = role.NormalizedName ?? string.Empty
                })
                .Where(candidate => !SystemRoles.IsSuperAdministratorValue(candidate.NormalizedName))
                .Select(
                    candidate => new GetRoleCandidatesResponse(
                        candidate.Role.Id,
                        candidate.Role.Name ?? string.Empty,
                        candidate.NormalizedName,
                        candidate.Role.Description))
                .ToList());
    }
}
