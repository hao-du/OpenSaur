using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole;

public static class CreateUserRoleHandler
{
    public static async Task<IResult> HandleAsync(
        CreateUserRoleRequest request,
        IValidator<CreateUserRoleRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        OutboxMessageWriter outboxMessageWriter,
        UserRepository userRepository,
        RoleRepository roleRepository,
        UserRoleRepository userRoleRepository,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var userResult = await userRepository.GetManagedUserByIdAsync(
            new GetManagedUserByIdRequest(request.UserId, currentUserContext),
            cancellationToken);
        if (!userResult.IsSuccess)
        {
            return userResult.ToApiErrorResult();
        }

        var rolesResult = await roleRepository.GetActiveRolesByIdsAsync(
            new GetActiveRolesByIdsRequest([request.RoleId]),
            cancellationToken);
        if (rolesResult.Value?.Roles.Count != 1)
        {
            return Result.Validation(UserRoleValidationProblems.ForRole()).ToApiErrorResult();
        }

        var existingAssignmentsResult = await userRoleRepository.GetUserRolesByUserAndRoleAsync(
            new GetUserRolesByUserAndRoleRequest(request.UserId, request.RoleId),
            cancellationToken);
        if (existingAssignmentsResult.Value is { UserRoles.Count: > 0 })
        {
            return Result.Validation(UserRoleValidationProblems.ForDuplicateAssignment()).ToApiErrorResult();
        }

        var assignment = new ApplicationUserRole
        {
            UserId = request.UserId,
            RoleId = request.RoleId,
            Description = request.Description,
            IsActive = true,
            CreatedBy = currentUserContext.UserId
        };

        dbContext.UserRoles.Add(assignment);
        outboxMessageWriter.EnqueueUserRoleCreated(assignment, currentUserContext.UserId);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
        {
            var result = UserRolePersistenceResults.TryTranslate(exception);
            if (result is not null)
            {
                return result.ToApiErrorResult();
            }

            throw;
        }

        return ApiResponses.Success(new CreateUserRoleResponse(assignment.Id));
    }
}
