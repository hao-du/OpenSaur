using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.UserRoles.EditUserRole;

public static class EditUserRoleHandler
{
    public static async Task<IResult> HandleAsync(
        EditUserRoleRequest request,
        IValidator<EditUserRoleRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        RoleRepository roleRepository,
        UserRoleRepository userRoleRepository,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var assignmentResult = await userRoleRepository.GetAccessibleUserRoleByIdAsync(
            new GetAccessibleUserRoleByIdRequest(request.Id, currentUserContext, TrackChanges: true),
            cancellationToken);
        if (!assignmentResult.IsSuccess || assignmentResult.Value is null)
        {
            return assignmentResult.ToApiErrorResult();
        }

        var rolesResult = await roleRepository.GetActiveRolesByIdsAsync(
            new GetActiveRolesByIdsRequest([request.RoleId]),
            cancellationToken);
        if (rolesResult.Value?.Roles.Count != 1)
        {
            return Result.Validation(UserRoleValidationProblems.ForRole()).ToApiErrorResult();
        }

        var assignment = assignmentResult.Value.UserRole;
        var duplicateAssignmentsResult = await userRoleRepository.GetUserRolesByUserAndRoleAsync(
            new GetUserRolesByUserAndRoleRequest(assignment.UserId, request.RoleId, request.Id),
            cancellationToken);
        if (duplicateAssignmentsResult.Value is { UserRoles.Count: > 0 })
        {
            return Result.Validation(UserRoleValidationProblems.ForDuplicateAssignment()).ToApiErrorResult();
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (assignment.RoleId == request.RoleId)
        {
            assignment.Description = request.Description;
            assignment.IsActive = request.IsActive;

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

            await transaction.CommitAsync(cancellationToken);

            return Result.Success().ToApiResult();
        }

        var replacementAssignment = new ApplicationUserRole
        {
            Id = assignment.Id,
            UserId = assignment.UserId,
            RoleId = request.RoleId,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedBy = assignment.CreatedBy,
            CreatedOn = assignment.CreatedOn,
            UpdatedBy = currentUserContext.UserId,
            UpdatedOn = DateTime.UtcNow
        };

        dbContext.UserRoles.Remove(assignment);
        await dbContext.SaveChangesAsync(cancellationToken);

        dbContext.UserRoles.Add(replacementAssignment);
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

        await transaction.CommitAsync(cancellationToken);

        return Result.Success().ToApiResult();
    }
}
