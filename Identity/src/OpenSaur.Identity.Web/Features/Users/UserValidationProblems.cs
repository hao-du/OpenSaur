using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Users;

internal static class UserValidationProblems
{
    public static ResultError[] ForWorkspace()
    {
        return
        [
            ResultErrors.Validation(
                "Invalid workspace selection.",
                "An active workspace is required.")
        ];
    }

    public static ResultError[] ForWorkspaceCapacity(int maxActiveUsers)
    {
        return
        [
            ResultErrors.Validation(
                ApiErrorCodes.UserWorkspaceCapacityReached,
                "Workspace active-user limit reached.",
                $"This workspace has reached its maximum of {maxActiveUsers} active users.")
        ];
    }
}
