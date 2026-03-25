using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Users;

internal static class UserValidationProblems
{
    public static ResultError[] FromIdentityErrors(IEnumerable<IdentityError> errors)
    {
        return errors
            .Select(error => ResultErrors.Validation("Validation failed.", error.Description))
            .ToArray();
    }

    public static ResultError[] ForWorkspace()
    {
        return
        [
            ResultErrors.Validation(
                "Invalid workspace selection.",
                "An active workspace is required.")
        ];
    }
}
