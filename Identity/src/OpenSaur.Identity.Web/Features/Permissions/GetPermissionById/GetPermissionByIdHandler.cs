using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Features.Permissions.GetPermissionById;

public static class GetPermissionByIdHandler
{
    public static async Task<IResult> HandleAsync(
        int codeId,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var permission = await dbContext.Permissions
            .AsNoTracking()
            .Include(candidate => candidate.PermissionScope)
            .SingleOrDefaultAsync(candidate => candidate.CodeId == codeId, cancellationToken);

        if (permission is null)
        {
            return Results.NotFound();
        }

        var definition = PermissionCatalog.GetDefinition(permission.CodeId);

        return Results.Ok(
            new GetPermissionByIdResponse(
                permission.Id,
                permission.CodeId,
                permission.PermissionScopeId,
                permission.PermissionScope?.Name ?? string.Empty,
                definition.Code,
                permission.Name,
                permission.Description,
                permission.IsActive));
    }
}
