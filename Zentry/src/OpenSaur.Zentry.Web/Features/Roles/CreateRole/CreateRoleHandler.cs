using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Identity;
using OpenSaur.Zentry.Web.Domain.Permissions;
using OpenSaur.Zentry.Web.Features.Permissions;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Roles.CreateRole;

public static class CreateRoleHandler
{
    public static async Task<Results<Ok<CreateRoleResponse>, ValidationProblem, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        CreateRoleRequest request,
        IValidator<CreateRoleRequest> validator,
        ApplicationDbContext dbContext,
        PermissionService permissionService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var name = request.Name.Trim();
        var normalizedName = NormalizeRoleName(name);
        var duplicateNameExists = await dbContext.Roles
            .AsNoTracking()
            .AnyAsync(candidate => candidate.NormalizedName == normalizedName, cancellationToken);
        if (duplicateNameExists)
        {
            return AppHttpResults.Conflict("Role name already exists.", "A role with this name already exists.");
        }

        var permissions = await permissionService.GetSelectedActivePermissionsAsync(request.PermissionCodes, cancellationToken);
        if (permissions.Count != request.PermissionCodes!.Distinct(StringComparer.Ordinal).Count())
        {
            return AppHttpResults.BadRequest("Invalid permissions.", "One or more selected permissions are inactive or do not exist.");
        }

        var currentUserId = ClaimHelper.GetCurrentUserId(httpContext.User);
        var role = new ApplicationRole
        {
            Id = Guid.CreateVersion7(),
            Name = name,
            NormalizedName = normalizedName,
            Description = request.Description,
            IsActive = true,
            CreatedBy = currentUserId
        };

        dbContext.Roles.Add(role);
        foreach (var permission in permissions)
        {
            dbContext.RolePermissions.Add(new RolePermission
            {
                RoleId = role.Id,
                PermissionId = permission.Id,
                Description = $"Assigned {permission.Name} to role {name}.",
                CreatedBy = currentUserId
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new CreateRoleResponse(role.Id));
    }

    internal static string NormalizeRoleName(string name)
    {
        return name.ToUpperInvariant();
    }
}
