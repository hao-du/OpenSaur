using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.UserRoles.GetRoleAssignments;

public static class GetRoleAssignmentsHandler
{
    public static async Task<IResult> HandleAsync(
        Guid roleId,
        CurrentUserContext currentUserContext,
        UserRoleRepository userRoleRepository,
        CancellationToken cancellationToken)
    {
        var userRolesResult = await userRoleRepository.GetAccessibleRoleAssignmentsAsync(
            new GetAccessibleRoleAssignmentsRequest(roleId, currentUserContext),
            cancellationToken);

        return userRolesResult.ToApiResult(
            response => response.UserRoles.Select(
                assignment => new GetRoleAssignmentsResponse(
                    assignment.Id,
                    assignment.UserId,
                    assignment.User?.UserName ?? string.Empty,
                    assignment.User?.WorkspaceId ?? Guid.Empty,
                    assignment.User?.Workspace?.Name ?? string.Empty,
                    assignment.Description,
                    assignment.IsActive))
                .ToList());
    }
}
