using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Roles.GetRoleById;

public static class GetRoleByIdHandler
{
    public static async Task<Results<Ok<GetRoleByIdResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var roleQuery = dbContext.Roles
            .AsNoTracking()
            .Where(candidate => candidate.Id == id)
            .Where(candidate => candidate.NormalizedName != Constants.NormalizedSuperAdministrator);

        if (!ClaimHelper.IsSuperAdministrator(user))
        {
            var workspaceId = ClaimHelper.GetWorkspaceId(user);
            roleQuery = workspaceId.HasValue
                ? roleQuery.Where(role => role.WorkspaceRoles.Any(workspaceRole =>
                    workspaceRole.IsActive
                    && workspaceRole.WorkspaceId == workspaceId.Value))
                : roleQuery.Where(static _ => false);
        }

        var role = await roleQuery.SingleOrDefaultAsync(cancellationToken);
        if (role is null)
        {
            return AppHttpResults.NotFound("Role not found.", "No role matched the provided identifier.");
        }

        var permissionCodes = await dbContext.RolePermissions
            .AsNoTracking()
            .Include(rolePermission => rolePermission.Permission)
            .Where(rolePermission => rolePermission.RoleId == id && rolePermission.IsActive)
            .Select(rolePermission => rolePermission.Permission!.Code)
            .OrderBy(code => code)
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new GetRoleByIdResponse(
            role.Id,
            role.Name ?? string.Empty,
            role.NormalizedName ?? string.Empty,
            role.Description,
            role.IsActive,
            permissionCodes));
    }
}
