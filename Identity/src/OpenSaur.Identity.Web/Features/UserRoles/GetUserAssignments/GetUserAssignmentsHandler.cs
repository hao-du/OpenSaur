using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.UserRoles.GetUserAssignments;

public static class GetUserAssignmentsHandler
{
    public static async Task<IResult> HandleAsync(
        Guid userId,
        CurrentUserContext currentUserContext,
        UserRoleRepository userRoleRepository,
        CancellationToken cancellationToken)
    {
        var userRolesResult = await userRoleRepository.GetAccessibleUserAssignmentsAsync(
            new GetAccessibleUserAssignmentsRequest(userId, currentUserContext),
            cancellationToken);

        return userRolesResult.ToApiResult(
            response => response.UserRoles.Select(
                assignment => new GetUserAssignmentsResponse(
                    assignment.Id,
                    assignment.UserId,
                    assignment.User?.UserName ?? string.Empty,
                    assignment.RoleId,
                    assignment.Role?.Name ?? string.Empty,
                    assignment.Role?.NormalizedName ?? string.Empty,
                    assignment.Description,
                    assignment.IsActive))
                .ToList());
    }
}
