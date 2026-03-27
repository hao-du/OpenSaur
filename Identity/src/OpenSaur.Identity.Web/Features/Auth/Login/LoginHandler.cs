using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Auth.Login;

public static class LoginHandler
{
    public static async Task<IResult> HandleAsync(
        LoginRequest request,
        IValidator<LoginRequest> validator,
        UserRepository userRepository,
        WorkspaceRepository workspaceRepository,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var normalizedUserName = userManager.NormalizeName(request.UserName);
        var userResult = await userRepository.GetUserByUserNameAsync(
            new GetUserByUserNameRequest(normalizedUserName, TrackChanges: true),
            cancellationToken);
        if (!userResult.IsSuccess || userResult.Value is null || !userResult.Value.User.IsActive)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The supplied credentials are invalid or the account is unavailable.")
                .ToApiErrorResult();
        }

        var workspaceResult = await workspaceRepository.GetActiveWorkspaceByIdAsync(
            new GetActiveWorkspaceByIdRequest(userResult.Value.User.WorkspaceId, TrackChanges: false),
            cancellationToken);
        if (!workspaceResult.IsSuccess)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The supplied credentials are invalid or the account is unavailable.")
                .ToApiErrorResult();
        }

        var passwordIsValid = await userManager.CheckPasswordAsync(userResult.Value.User, request.Password);
        if (!passwordIsValid)
        {
            return Result.Unauthorized(
                    "Authentication failed.",
                    "The supplied credentials are invalid or the account is unavailable.")
                .ToApiErrorResult();
        }

        await signInManager.SignInAsync(userResult.Value.User, isPersistent: false);

        return Result.Success().ToApiResult();
    }
}
