using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Validation;

internal static class ValidationErrorMappings
{
    public static ResultError[] ToResultErrors(IEnumerable<IdentityError> errors)
    {
        return errors
            .Select(error => ResultErrors.Validation("Validation failed.", error.Description))
            .ToArray();
    }
}
