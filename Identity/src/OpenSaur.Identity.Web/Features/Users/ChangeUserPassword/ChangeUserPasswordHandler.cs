using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Persistence;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Users.ChangeUserPassword;

public static class ChangeUserPasswordHandler
{
    public static async Task<IResult> HandleAsync(
        ChangeUserPasswordRequest request,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users.AsQueryable();
        if (!currentUserContext.IsSuperAdministrator)
        {
            query = query.Where(candidate => candidate.WorkspaceId == currentUserContext.WorkspaceId);
        }

        var user = await query.SingleOrDefaultAsync(candidate => candidate.Id == request.UserId, cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
        if (!resetResult.Succeeded)
        {
            return Results.ValidationProblem(UserValidationProblems.FromIdentityErrors(resetResult.Errors));
        }

        user.RequirePasswordChange = true;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Results.ValidationProblem(UserValidationProblems.FromIdentityErrors(updateResult.Errors));
        }

        return Results.NoContent();
    }
}
