using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;

public sealed class UserRoleRepository(ApplicationDbContext dbContext)
{
    public async Task<Result<GetAccessibleUserRolesResponse>> GetAccessibleUserRolesAsync(
        GetAccessibleUserRolesRequest request,
        CancellationToken cancellationToken)
    {
        var userRoles = await ApplyManagedScope(
                dbContext.UserRoles
                    .AsNoTracking()
                    .Include(candidate => candidate.User)
                    .Include(candidate => candidate.Role)
                    .OrderBy(candidate => candidate.User!.UserName)
                    .ThenBy(candidate => candidate.Role!.Name),
                request.CurrentUserContext)
            .ToListAsync(cancellationToken);

        return Result<GetAccessibleUserRolesResponse>.Success(new GetAccessibleUserRolesResponse(userRoles));
    }

    public async Task<Result<GetAccessibleRoleAssignmentsResponse>> GetAccessibleRoleAssignmentsAsync(
        GetAccessibleRoleAssignmentsRequest request,
        CancellationToken cancellationToken)
    {
        var userRoles = await ApplyManagedScope(
                dbContext.UserRoles
                    .AsNoTracking()
                    .Include(candidate => candidate.User)
                    .ThenInclude(user => user!.Workspace)
                    .Where(candidate => candidate.RoleId == request.RoleId)
                    .Where(candidate => candidate.IsActive)
                    .Where(candidate => candidate.User != null && candidate.User.IsActive)
                    .OrderBy(candidate => candidate.User!.UserName),
                request.CurrentUserContext)
            .ToListAsync(cancellationToken);

        return Result<GetAccessibleRoleAssignmentsResponse>.Success(new GetAccessibleRoleAssignmentsResponse(userRoles));
    }

    public async Task<Result<GetAccessibleUserAssignmentsResponse>> GetAccessibleUserAssignmentsAsync(
        GetAccessibleUserAssignmentsRequest request,
        CancellationToken cancellationToken)
    {
        var userRoles = await ApplyManagedScope(
                dbContext.UserRoles
                    .AsNoTracking()
                    .Include(candidate => candidate.User)
                    .Include(candidate => candidate.Role)
                    .Where(candidate => candidate.UserId == request.UserId)
                    .OrderBy(candidate => candidate.Role!.Name),
                request.CurrentUserContext)
            .ToListAsync(cancellationToken);

        return Result<GetAccessibleUserAssignmentsResponse>.Success(new GetAccessibleUserAssignmentsResponse(userRoles));
    }

    public async Task<Result<GetAccessibleUserRoleByIdResponse>> GetAccessibleUserRoleByIdAsync(
        GetAccessibleUserRoleByIdRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.UserRoles
                .Include(candidate => candidate.User)
                .Include(candidate => candidate.Role)
            : dbContext.UserRoles
                .AsNoTracking()
                .Include(candidate => candidate.User)
                .Include(candidate => candidate.Role);

        var userRole = await ApplyManagedScope(query, request.CurrentUserContext)
            .SingleOrDefaultAsync(candidate => candidate.Id == request.UserRoleId, cancellationToken);

        return userRole is null
            ? Result<GetAccessibleUserRoleByIdResponse>.NotFound(
                "User-role assignment not found.",
                "No accessible user-role assignment matched the provided identifier.")
            : Result<GetAccessibleUserRoleByIdResponse>.Success(new GetAccessibleUserRoleByIdResponse(userRole));
    }

    public async Task<Result<GetUserRolesByUserAndRoleResponse>> GetUserRolesByUserAndRoleAsync(
        GetUserRolesByUserAndRoleRequest request,
        CancellationToken cancellationToken)
    {
        var query = dbContext.UserRoles
            .AsNoTracking()
            .Where(candidate => candidate.UserId == request.UserId && candidate.RoleId == request.RoleId);

        if (request.ExcludedUserRoleId.HasValue)
        {
            query = query.Where(candidate => candidate.Id != request.ExcludedUserRoleId.Value);
        }

        var userRoles = await query.ToListAsync(cancellationToken);

        return Result<GetUserRolesByUserAndRoleResponse>.Success(new GetUserRolesByUserAndRoleResponse(userRoles));
    }

    public async Task<Result<GetActiveNormalizedRoleNamesForUserResponse>> GetActiveNormalizedRoleNamesForUserAsync(
        GetActiveNormalizedRoleNamesForUserRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedRoleNames = await dbContext.UserRoles
            .AsNoTracking()
            .Where(userRole => userRole.UserId == request.UserId && userRole.IsActive)
            .Join(
                dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                userRole => userRole.RoleId,
                role => role.Id,
                (_, role) => role.NormalizedName ?? string.Empty)
            .Where(static role => !string.IsNullOrWhiteSpace(role))
            .Distinct()
            .ToListAsync(cancellationToken);

        return Result<GetActiveNormalizedRoleNamesForUserResponse>.Success(
            new GetActiveNormalizedRoleNamesForUserResponse(normalizedRoleNames));
    }

    private static IQueryable<ApplicationUserRole> ApplyManagedScope(
        IQueryable<ApplicationUserRole> query,
        CurrentUserContext currentUserContext)
    {
        return currentUserContext.HasGlobalWorkspaceScope
            ? query
            : query.Where(
                candidate => candidate.User != null && candidate.User.WorkspaceId == currentUserContext.WorkspaceId);
    }
}
