using FluentValidation;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Roles.CreateRole;

public static class CreateRoleHandler
{
    public static async Task<IResult> HandleAsync(
        CreateRoleRequest request,
        IValidator<CreateRoleRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        OutboxMessageWriter outboxMessageWriter,
        PermissionRepository permissionRepository,
        RoleManager<ApplicationRole> roleManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var selectedCodeIds = request.PermissionCodeIds
            .Distinct()
            .ToArray();
        var permissionsResult = await permissionRepository.GetActivePermissionsByCodeIdsAsync(
            new GetActivePermissionsByCodeIdsRequest(selectedCodeIds),
            cancellationToken);
        var permissions = permissionsResult.Value?.Permissions ?? [];

        if (permissions.Count != selectedCodeIds.Length)
        {
            return Result.Validation(RoleValidationProblems.ForPermissions()).ToApiErrorResult();
        }

        var role = new ApplicationRole
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
            CreatedBy = currentUserContext.UserId
        };

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var createResult = await roleManager.CreateAsync(role);
        if (!createResult.Succeeded)
        {
            return Result.Validation(ValidationErrorMappings.ToResultErrors(createResult.Errors)).ToApiErrorResult();
        }

        foreach (var permission in permissions)
        {
            dbContext.RolePermissions.Add(
                new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permission.Id,
                    Description = $"Assigned {permission.Name} to role {request.Name}.",
                    CreatedBy = currentUserContext.UserId
                });
        }

        outboxMessageWriter.EnqueueRolePermissionsCreated(role, selectedCodeIds, currentUserContext.UserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return ApiResponses.Success(new CreateRoleResponse(role.Id));
    }
}
