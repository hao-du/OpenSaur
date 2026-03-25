using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Users.CreateUser;

public static class CreateUserHandler
{
    public static async Task<IResult> HandleAsync(
        CreateUserRequest request,
        IValidator<CreateUserRequest> validator,
        CurrentUserContext currentUserContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var user = new ApplicationUser
        {
            UserName = request.UserName,
            Email = request.Email,
            WorkspaceId = currentUserContext.WorkspaceId,
            Description = request.Description,
            UserSettings = string.IsNullOrWhiteSpace(request.UserSettings) ? "{}" : request.UserSettings,
            RequirePasswordChange = true,
            IsActive = true,
            CreatedBy = currentUserContext.UserId
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return Result.Validation(UserValidationProblems.FromIdentityErrors(createResult.Errors)).ToApiErrorResult();
        }

        return ApiResponses.Success(new CreateUserResponse(user.Id));
    }
}
