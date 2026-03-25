using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Roles.EditRole;

public static class EditRoleHandler
{
    public static async Task<IResult> HandleAsync(
        EditRoleRequest request,
        IValidator<EditRoleRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        RoleRepository roleRepository,
        PermissionRepository permissionRepository,
        RoleManager<ApplicationRole> roleManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var roleResult = await roleRepository.GetRoleByIdAsync(
            new GetRoleByIdRequest(request.Id, TrackChanges: true),
            cancellationToken);
        if (!roleResult.IsSuccess || roleResult.Value is null)
        {
            return roleResult.ToApiErrorResult();
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

        var role = roleResult.Value.Role;
        role.Name = request.Name;
        role.Description = request.Description;
        role.IsActive = request.IsActive;

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var updateResult = await roleManager.UpdateAsync(role);
        if (!updateResult.Succeeded)
        {
            return Result.Validation(RoleValidationProblems.FromIdentityErrors(updateResult.Errors)).ToApiErrorResult();
        }

        var selectedPermissionIds = permissions
            .Select(permission => permission.Id)
            .ToHashSet();
        var existingAssignments = await dbContext.RolePermissions
            .Where(rolePermission => rolePermission.RoleId == role.Id)
            .ToListAsync(cancellationToken);

        foreach (var assignment in existingAssignments)
        {
            assignment.IsActive = selectedPermissionIds.Contains(assignment.PermissionId);
        }

        var existingPermissionIds = existingAssignments
            .Select(assignment => assignment.PermissionId)
            .ToHashSet();

        foreach (var permission in permissions)
        {
            if (existingPermissionIds.Contains(permission.Id))
            {
                continue;
            }

            dbContext.RolePermissions.Add(
                new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permission.Id,
                    Description = $"Assigned {permission.Name} to role {request.Name}.",
                    CreatedBy = currentUserContext.UserId
                });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result.Success().ToApiResult();
    }
}
