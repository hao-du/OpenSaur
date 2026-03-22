using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Persistence;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Users.GetUserById;

public static class GetUserByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users.AsNoTracking().AsQueryable();
        if (!currentUserContext.IsSuperAdministrator)
        {
            query = query.Where(candidate => candidate.WorkspaceId == currentUserContext.WorkspaceId);
        }

        var user = await query.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(
            new GetUserByIdResponse(
                user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                user.WorkspaceId,
                user.Description,
                user.IsActive,
                user.RequirePasswordChange,
                user.UserSettings));
    }
}
