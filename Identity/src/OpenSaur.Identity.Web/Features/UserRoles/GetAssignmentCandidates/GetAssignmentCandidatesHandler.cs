using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.UserRoles.GetAssignmentCandidates;

public static class GetAssignmentCandidatesHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        UserRepository userRepository,
        CancellationToken cancellationToken)
    {
        var usersResult = await userRepository.GetManagedActiveUsersAsync(
            new GetManagedActiveUsersRequest(currentUserContext),
            cancellationToken);

        return usersResult.ToApiResult(
            response => response.Users.Select(
                user => new GetAssignmentCandidatesResponse(
                    user.Id,
                    user.UserName ?? string.Empty,
                    user.Email ?? string.Empty,
                    user.WorkspaceId,
                    user.Workspace?.Name ?? string.Empty))
                .ToList());
    }
}
