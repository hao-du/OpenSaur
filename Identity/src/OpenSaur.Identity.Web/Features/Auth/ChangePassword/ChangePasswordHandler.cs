using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Features.Auth.ChangePassword;

public static class ChangePasswordHandler
{
    public static async Task<IResult> HandleAsync(
        ChangePasswordRequest request,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager)
    {
        var userId = AuthPrincipalReader.GetUserId(principal);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.Unauthorized();
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return Results.Unauthorized();
        }

        var changePasswordResult = await userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);
        if (!changePasswordResult.Succeeded)
        {
            return Results.ValidationProblem(ToValidationProblem(changePasswordResult.Errors));
        }

        if (user.RequirePasswordChange)
        {
            user.RequirePasswordChange = false;
            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return Results.ValidationProblem(ToValidationProblem(updateResult.Errors));
            }
        }

        return Results.NoContent();
    }

    private static IDictionary<string, string[]> ToValidationProblem(IEnumerable<IdentityError> errors)
    {
        return errors
            .GroupBy(static error => error.Code)
            .ToDictionary(
                group => group.Key,
                group => group.Select(static error => error.Description).ToArray());
    }
}
