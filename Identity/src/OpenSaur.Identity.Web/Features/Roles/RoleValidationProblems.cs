using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Roles;

internal static class RoleValidationProblems
{
    public static ResultError[] FromIdentityErrors(IEnumerable<IdentityError> errors)
    {
        return errors
            .Select(error => ResultErrors.Validation("Validation failed.", error.Description))
            .ToArray();
    }

    public static ResultError[] ForPermissions()
    {
        return
        [
            ResultErrors.Validation(
                "Invalid permission selection.",
                "One or more permissions are invalid.")
        ];
    }
}
