using Microsoft.AspNetCore.Identity;

namespace OpenSaur.Identity.Web.Features.Users;

internal static class UserValidationProblems
{
    public static Dictionary<string, string[]> FromIdentityErrors(IEnumerable<IdentityError> errors)
    {
        return errors
            .GroupBy(error => error.Code)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.Description).ToArray());
    }

    public static Dictionary<string, string[]> ForWorkspace()
    {
        return new Dictionary<string, string[]>
        {
            ["WorkspaceId"] = ["An active workspace is required."]
        };
    }
}
