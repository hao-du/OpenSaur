using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Users.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Auth.ChangePassword;

public static class ChangePasswordHandler
{
    public static async Task<IResult> HandleAsync(
        ChangePasswordRequest request,
        IValidator<ChangePasswordRequest> validator,
        ClaimsPrincipal principal,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        UserOutboxWriter userOutboxWriter,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var userId = AuthPrincipalReader.GetUserId(principal);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Result.Unauthorized(
                    "Authentication is required.",
                    "The request requires a valid authenticated API session or bearer token.")
                .ToApiErrorResult();
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return Result.Unauthorized(
                    "Authentication is required.",
                    "The request requires a valid authenticated API session or bearer token.")
                .ToApiErrorResult();
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var changePasswordResult = await userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);
        if (!changePasswordResult.Succeeded)
        {
            return Result.Validation(ValidationErrorMappings.ToResultErrors(changePasswordResult.Errors)).ToApiErrorResult();
        }

        if (user.RequirePasswordChange)
        {
            user.RequirePasswordChange = false;
            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return Result.Validation(ValidationErrorMappings.ToResultErrors(updateResult.Errors)).ToApiErrorResult();
            }
        }

        userOutboxWriter.EnqueueUserUpdated(user, currentUserContext.UserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result.Success().ToApiResult();
    }
}
