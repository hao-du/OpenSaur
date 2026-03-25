using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.UserRoles;

internal static class UserRoleValidationProblems
{
    public static ResultError[] ForRole()
    {
        return
        [
            ResultErrors.Validation(
                "Invalid role selection.",
                "An active role is required.")
        ];
    }

    public static ResultError[] ForDuplicateAssignment()
    {
        return
        [
            ResultErrors.Validation(
                "Duplicate role assignment.",
                "The user already has this role assignment.")
        ];
    }
}
