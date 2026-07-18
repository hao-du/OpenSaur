using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Features.Permissions;
using OpenSaur.Zentry.Web.Features.Roles.CreateRole;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Roles.EditRole;

public static class EditRoleHandler
{
    public static async Task<Results<NoContent, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        EditRoleRequest request,
        IValidator<EditRoleRequest> validator,
        ApplicationDbContext dbContext,
        PermissionService permissionService,
        RoleService roleService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var role = await dbContext.Roles
            .SingleOrDefaultAsync(candidate => candidate.Id == request.Id, cancellationToken);
        if (role is null)
        {
            return AppHttpResults.NotFound("Role not found.", "No role matched the provided identifier.");
        }

        if (string.Equals(role.NormalizedName, Constants.NormalizedSuperAdministrator, StringComparison.Ordinal))
        {
            return AppHttpResults.BadRequest("Role cannot be edited.", "The super administrator role cannot be edited.");
        }

        var name = request.Name.Trim();
        var normalizedName = CreateRoleHandler.NormalizeRoleName(name);
        var duplicateNameExists = await dbContext.Roles
            .AsNoTracking()
            .AnyAsync(candidate => candidate.Id != request.Id && candidate.NormalizedName == normalizedName, cancellationToken);
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
        role.Name = name;
        role.NormalizedName = normalizedName;
        role.Description = request.Description;
        role.IsActive = request.IsActive;
        role.UpdatedBy = currentUserId;

        await roleService.ApplyRolePermissionsAsync(request.Id, permissions, name, currentUserId, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
