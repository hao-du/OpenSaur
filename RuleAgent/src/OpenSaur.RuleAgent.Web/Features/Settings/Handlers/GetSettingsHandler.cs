using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Settings.Handlers;

public static class GetSettingsHandler
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

        var userSettings = await dbContext.Users
            .AsNoTracking()
            .Where(u =>
                (userContext.UserId.HasValue && u.Id == userContext.UserId.Value) ||
                (!string.IsNullOrWhiteSpace(userContext.Email) && u.Email == userContext.Email))
            .Select(u => u.UserSettings)
            .FirstOrDefaultAsync(cancellationToken);

        if (userSettings is null)
        {
            return Results.NotFound(new { message = "User not found." });
        }

        return Results.Ok(SettingsJsonHelper.Read(userSettings));
    }
}
