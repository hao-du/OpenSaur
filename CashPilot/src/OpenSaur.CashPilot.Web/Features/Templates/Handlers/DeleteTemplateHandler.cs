using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Templates.Handlers;

public static class DeleteTemplateHandler
{
    public static async Task<Results<NoContent, NotFound>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var template = await dbContext.Templates
            .SingleOrDefaultAsync(candidate => candidate.OwnerId == currentUserId && candidate.Id == id, cancellationToken);

        if (template is null)
        {
            return TypedResults.NotFound();
        }

        template.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
