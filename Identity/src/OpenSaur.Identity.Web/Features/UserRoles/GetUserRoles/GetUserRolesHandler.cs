using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.UserRoles.GetUserRoles;

public static class GetUserRolesHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        UserRoleRepository userRoleRepository,
        CancellationToken cancellationToken)
    {
        var userRolesResult = await userRoleRepository.GetAccessibleUserRolesAsync(
            new GetAccessibleUserRolesRequest(currentUserContext),
            cancellationToken);

        return userRolesResult.ToApiResult(
            response => response.UserRoles.Select(
                assignment => new GetUserRolesResponse(
                    assignment.Id,
                    assignment.UserId,
                    assignment.User?.UserName ?? string.Empty,
                    assignment.RoleId,
                    assignment.Role?.Name ?? string.Empty,
                    assignment.Description,
                    assignment.IsActive))
                .ToList());
    }
}
