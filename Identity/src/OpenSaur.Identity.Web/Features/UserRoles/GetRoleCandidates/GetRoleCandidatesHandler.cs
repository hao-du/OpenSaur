using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Features.UserRoles.GetRoleCandidates;

public static class GetRoleCandidatesHandler
{
    public static async Task<IResult> HandleAsync(
        RoleRepository roleRepository,
        CancellationToken cancellationToken)
    {
        var rolesResult = await roleRepository.GetActiveRolesAsync(
            new GetActiveRolesRequest(),
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
