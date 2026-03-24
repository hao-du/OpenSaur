using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Roles.CreateRole;

public static class CreateRoleHandler
{
    public static async Task<IResult> HandleAsync(
        CreateRoleRequest request,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        RoleManager<ApplicationRole> roleManager,
        CancellationToken cancellationToken)
    {
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
            return Results.ValidationProblem(RoleValidationProblems.FromIdentityErrors(createResult.Errors));
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

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Results.Created(
            $"/api/role/getbyid/{role.Id}",
            new CreateRoleResponse(role.Id));
    }
}
