using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Roles.EditRole;

public static class EditRoleHandler
{
    public static async Task<IResult> HandleAsync(
        EditRoleRequest request,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        RoleManager<ApplicationRole> roleManager,
        CancellationToken cancellationToken)
    {
        var role = await dbContext.Roles.SingleOrDefaultAsync(candidate => candidate.Id == request.Id, cancellationToken);
        if (role is null)
        {
            return Results.NotFound();
        }

        var selectedCodeIds = request.PermissionCodeIds
            .Distinct()
            .ToArray();
        var permissions = await dbContext.Permissions
            .Where(permission => permission.IsActive && selectedCodeIds.Contains(permission.CodeId))
            .ToListAsync(cancellationToken);

        if (permissions.Count != selectedCodeIds.Length)
        {
            return Results.ValidationProblem(RoleValidationProblems.ForPermissions());
        }

        role.Name = request.Name;
        role.Description = request.Description;
        role.IsActive = request.IsActive;

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var updateResult = await roleManager.UpdateAsync(role);
        if (!updateResult.Succeeded)
        {
            return Results.ValidationProblem(RoleValidationProblems.FromIdentityErrors(updateResult.Errors));
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

        return Results.NoContent();
    }
}
