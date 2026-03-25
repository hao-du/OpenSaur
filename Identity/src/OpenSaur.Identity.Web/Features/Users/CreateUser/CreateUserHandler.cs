using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Users.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database;
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
        ApplicationDbContext dbContext,
        UserOutboxWriter userOutboxWriter,
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

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return Result.Validation(ValidationErrorMappings.ToResultErrors(createResult.Errors)).ToApiErrorResult();
        }

        userOutboxWriter.EnqueueUserCreated(user, currentUserContext.UserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return ApiResponses.Success(new CreateUserResponse(user.Id));
    }
}
