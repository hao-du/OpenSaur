using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Users.GetUsers;

public static class GetUsersHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users
            .AsNoTracking()
            .OrderBy(user => user.UserName)
            .AsQueryable();

        if (!currentUserContext.IsSuperAdministrator)
        {
            query = query.Where(user => user.WorkspaceId == currentUserContext.WorkspaceId);
        }

        var payload = await query
            .Select(user => new GetUsersResponse(
                user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                user.WorkspaceId,
                user.IsActive,
                user.RequirePasswordChange))
            .ToListAsync(cancellationToken);

        return Results.Ok(payload);
    }
}
