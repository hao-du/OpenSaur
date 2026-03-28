using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;

namespace OpenSaur.Identity.Web.Features.Roles.GetRoles;

public static class GetRolesHandler
{
    public static async Task<IResult> HandleAsync(
        RoleRepository roleRepository,
        CancellationToken cancellationToken)
    {
        var rolesResult = await roleRepository.GetRolesAsync(new GetRolesRequest(), cancellationToken);

        return rolesResult.ToApiResult(
            response => response.Roles.Select(
                static role => new GetRolesResponse(
                    role.Id,
                    role.Name ?? string.Empty,
                    role.NormalizedName ?? string.Empty,
                    role.Description,
                    role.IsActive))
                .ToList());
    }
}
