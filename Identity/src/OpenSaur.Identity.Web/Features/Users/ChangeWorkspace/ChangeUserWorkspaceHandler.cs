using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Users.ChangeWorkspace;

public static class ChangeUserWorkspaceHandler
{
    public static async Task<IResult> HandleAsync(
        ChangeUserWorkspaceRequest request,
        IValidator<ChangeUserWorkspaceRequest> validator,
        UserRepository userRepository,
        WorkspaceRepository workspaceRepository,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var userResult = await userRepository.GetUserByIdAsync(
            new GetUserByIdRequest(request.UserId, TrackChanges: true),
            cancellationToken);
        if (!userResult.IsSuccess || userResult.Value is null)
        {
            return userResult.ToApiErrorResult();
        }

        var workspaceResult = await workspaceRepository.GetActiveWorkspaceByIdAsync(
            new GetActiveWorkspaceByIdRequest(request.WorkspaceId, TrackChanges: false),
            cancellationToken);
        if (!workspaceResult.IsSuccess)
        {
            return workspaceResult.ToApiErrorResult();
        }

        var user = userResult.Value.User;
        user.WorkspaceId = request.WorkspaceId;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Result.Validation(UserValidationProblems.FromIdentityErrors(updateResult.Errors)).ToApiErrorResult();
        }

        return Result.Success().ToApiResult();
    }
}
