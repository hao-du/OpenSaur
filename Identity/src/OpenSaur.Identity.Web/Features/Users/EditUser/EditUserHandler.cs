using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Users.EditUser;

public static class EditUserHandler
{
    public static async Task<IResult> HandleAsync(
        EditUserRequest request,
        IValidator<EditUserRequest> validator,
        CurrentUserContext currentUserContext,
        UserRepository userRepository,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var userResult = await userRepository.GetManagedUserByIdAsync(
            new GetManagedUserByIdRequest(request.Id, currentUserContext, TrackChanges: true),
            cancellationToken);
        if (!userResult.IsSuccess || userResult.Value is null)
        {
            return userResult.ToApiErrorResult();
        }

        var user = userResult.Value.User;
        user.UserName = request.UserName;
        user.Email = request.Email;
        user.Description = request.Description;
        user.IsActive = request.IsActive;
        user.UserSettings = string.IsNullOrWhiteSpace(request.UserSettings) ? "{}" : request.UserSettings;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Result.Validation(UserValidationProblems.FromIdentityErrors(updateResult.Errors)).ToApiErrorResult();
        }

        return Result.Success().ToApiResult();
    }
}
