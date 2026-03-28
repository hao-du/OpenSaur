using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;

public sealed class RoleRepository(ApplicationDbContext dbContext)
{
    public async Task<Result<GetRolesResponse>> GetRolesAsync(
        GetRolesRequest request,
        CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
            .OrderBy(role => role.Name)
            .ToListAsync(cancellationToken);

        return Result<GetRolesResponse>.Success(new GetRolesResponse(roles));
    }

    public async Task<Result<GetRoleByIdResponse>> GetRoleByIdAsync(
        GetRoleByIdRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.Roles.AsQueryable()
            : dbContext.Roles.AsNoTracking();

        var role = await query.SingleOrDefaultAsync(candidate => candidate.Id == request.RoleId, cancellationToken);

        return role is null
            ? Result<GetRoleByIdResponse>.NotFound(
                "Role not found.",
                "No role matched the provided identifier.")
            : Result<GetRoleByIdResponse>.Success(new GetRoleByIdResponse(role));
    }

    public async Task<Result<GetActiveRolesByIdsResponse>> GetActiveRolesByIdsAsync(
        GetActiveRolesByIdsRequest request,
        CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
            .Where(role => role.IsActive && request.RoleIds.Contains(role.Id))
            .ToListAsync(cancellationToken);

        return Result<GetActiveRolesByIdsResponse>.Success(new GetActiveRolesByIdsResponse(roles));
    }

    public async Task<Result<GetActiveRolesResponse>> GetActiveRolesAsync(
        GetActiveRolesRequest request,
        CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
            .Where(role => role.IsActive)
            .OrderBy(role => role.Name)
            .ToListAsync(cancellationToken);

        return Result<GetActiveRolesResponse>.Success(new GetActiveRolesResponse(roles));
    }
}
