using OpenSaur.Identity.Web.Features.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Users;

internal static class UserCapacityGuard
{
    public static async Task<Result?> EnsureCanIncreaseActiveUserCountAsync(
        CurrentUserContext currentUserContext,
        WorkspaceRepository workspaceRepository,
        UserRepository userRepository,
        CancellationToken cancellationToken)
    {
        var workspaceResult = await workspaceRepository.GetActiveWorkspaceByIdAsync(
            new GetActiveWorkspaceByIdRequest(currentUserContext.WorkspaceId),
            cancellationToken);
        if (!workspaceResult.IsSuccess || workspaceResult.Value is null)
        {
            return Result.Validation(UserValidationProblems.ForWorkspace());
        }

        var maxActiveUsers = workspaceResult.Value.Workspace.MaxActiveUsers;
        if (!maxActiveUsers.HasValue)
        {
            return null;
        }

        var activeUserCountResult = await userRepository.GetActiveUserCountByWorkspaceIdAsync(
            new GetActiveUserCountByWorkspaceIdRequest(currentUserContext.WorkspaceId),
            cancellationToken);
        if (!activeUserCountResult.IsSuccess || activeUserCountResult.Value is null)
        {
            return Result.Validation(UserValidationProblems.ForWorkspace());
        }

        return activeUserCountResult.Value.Count >= maxActiveUsers.Value
            ? Result.Validation(UserValidationProblems.ForWorkspaceCapacity(maxActiveUsers.Value))
            : null;
    }
}
