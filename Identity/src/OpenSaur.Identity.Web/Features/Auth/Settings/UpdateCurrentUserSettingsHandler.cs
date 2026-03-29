using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Auth.Settings;

public static class UpdateCurrentUserSettingsHandler
{
    public static async Task<IResult> HandleAsync(
        UpdateCurrentUserSettingsRequest request,
        IValidator<UpdateCurrentUserSettingsRequest> validator,
        CurrentUserContext currentUserContext,
        UserRepository userRepository,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var userResult = await userRepository.GetUserByIdAsync(
            new GetUserByIdRequest(currentUserContext.UserId, TrackChanges: true),
            cancellationToken);
        if (!userResult.IsSuccess || userResult.Value is null)
        {
            return userResult.ToApiErrorResult();
        }

        var user = userResult.Value.User;
        user.UserSettings = CurrentUserSettingsJson.Merge(user.UserSettings, request);

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Result.Validation(ValidationErrorMappings.ToResultErrors(updateResult.Errors)).ToApiErrorResult();
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return ApiResponses.Success(new AuthSettingsResponse(request.Locale, request.TimeZone));
    }
}
