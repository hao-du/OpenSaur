using Microsoft.AspNetCore.Identity;

namespace OpenSaur.Identity.Web.Features.Roles;

internal static class RoleValidationProblems
{
    public static Dictionary<string, string[]> FromIdentityErrors(IEnumerable<IdentityError> errors)
    {
        return errors
            .GroupBy(error => error.Code)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.Description).ToArray());
    }

    public static Dictionary<string, string[]> ForPermissions()
    {
        return new Dictionary<string, string[]>
        {
            ["PermissionCodeIds"] = ["One or more permissions are invalid."]
        };
    }
}
