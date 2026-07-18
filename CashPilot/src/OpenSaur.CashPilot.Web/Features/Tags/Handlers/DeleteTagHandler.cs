using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Tags.Handlers;

public static class DeleteTagHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        IHybridCacheService cache,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var entity = await dbContext.TagDefinitions.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == currentUserId, cancellationToken);
        if (entity is null)
        {
            return TypedResults.NotFound(new ProblemDetails { Title = "Tag not found", Detail = "No matching tag definition found." });
        }

        entity.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);

        await cache.RemoveAsync(CacheConstants.TagsKey(currentUserId));

        return TypedResults.NoContent();
    }
}
