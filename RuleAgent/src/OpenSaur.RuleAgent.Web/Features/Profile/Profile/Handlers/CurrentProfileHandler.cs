using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Features.Profile.Profile.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Profile.Profile.Handlers;

public static class CurrentProfileHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!userContext.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                (userContext.UserId.HasValue && u.Id == userContext.UserId.Value) ||
                (!string.IsNullOrWhiteSpace(userContext.Email) && u.Email == userContext.Email),
                cancellationToken);

        if (user is null)
        {
            return Results.NotFound(new { message = "User record not synchronized yet." });
        }

        var response = new CurrentProfileResponse(
            user.Id,
            user.WorkspaceId,
            user.Email,
            user.UserName,
            user.FirstName,
            user.LastName,
            userContext.IsSuperAdministrator,
            user.Roles,
            user.Permissions);

        return Results.Ok(response);
    }
}
