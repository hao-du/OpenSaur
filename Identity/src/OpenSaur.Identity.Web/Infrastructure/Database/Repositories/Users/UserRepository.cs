using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;

public class UserRepository(ApplicationDbContext dbContext)
{
    public virtual async Task<Result<GetManagedUsersResponse>> GetManagedUsersAsync(
        GetManagedUsersRequest request,
        CancellationToken cancellationToken)
    {
        var users = await ApplyManagedScope(
                dbContext.Users
                    .AsNoTracking()
                    .OrderBy(user => user.UserName),
                request.CurrentUserContext)
            .ToListAsync(cancellationToken);

        return Result<GetManagedUsersResponse>.Success(new GetManagedUsersResponse(users));
    }

    public virtual async Task<Result<GetManagedUserByIdResponse>> GetManagedUserByIdAsync(
        GetManagedUserByIdRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.Users.AsQueryable()
            : dbContext.Users.AsNoTracking();

        var user = await ApplyManagedScope(query, request.CurrentUserContext)
            .SingleOrDefaultAsync(candidate => candidate.Id == request.UserId, cancellationToken);

        return user is null
            ? Result<GetManagedUserByIdResponse>.NotFound(
                "User not found.",
                "No accessible user matched the provided identifier.")
            : Result<GetManagedUserByIdResponse>.Success(new GetManagedUserByIdResponse(user));
    }

    public virtual async Task<Result<GetUserByIdResponse>> GetUserByIdAsync(
        GetUserByIdRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.Users.AsQueryable()
            : dbContext.Users.AsNoTracking();

        var user = await query.SingleOrDefaultAsync(candidate => candidate.Id == request.UserId, cancellationToken);

        return user is null
            ? Result<GetUserByIdResponse>.NotFound(
                "User not found.",
                "No user matched the provided identifier.")
            : Result<GetUserByIdResponse>.Success(new GetUserByIdResponse(user));
    }

    public virtual async Task<Result<GetUserByUserNameResponse>> GetUserByUserNameAsync(
        GetUserByUserNameRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.Users.AsQueryable()
            : dbContext.Users.AsNoTracking();

        var user = await query.SingleOrDefaultAsync(candidate => candidate.UserName == request.UserName, cancellationToken);

        return user is null
            ? Result<GetUserByUserNameResponse>.NotFound(
                "User not found.",
                "No user matched the provided user name.")
            : Result<GetUserByUserNameResponse>.Success(new GetUserByUserNameResponse(user));
    }

    private static IQueryable<ApplicationUser> ApplyManagedScope(
        IQueryable<ApplicationUser> query,
        CurrentUserContext currentUserContext)
    {
        return currentUserContext.IsSuperAdministrator
            ? query
            : query.Where(candidate => candidate.WorkspaceId == currentUserContext.WorkspaceId);
    }
}
