using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.UserRoles;

internal static class UserRolePersistenceResults
{
    public static Result? TryTranslate(DbUpdateException exception)
    {
        if (DatabaseExceptionClassifier.IsUniqueConstraintViolation(exception))
        {
            return Result.Validation(UserRoleValidationProblems.ForDuplicateAssignment());
        }

        if (DatabaseExceptionClassifier.IsForeignKeyConstraintViolation(exception))
        {
            return Result.Validation(
                ResultErrors.Validation(
                    "Invalid user-role assignment.",
                    "The selected user or role is no longer available."));
        }

        return null;
    }
}
