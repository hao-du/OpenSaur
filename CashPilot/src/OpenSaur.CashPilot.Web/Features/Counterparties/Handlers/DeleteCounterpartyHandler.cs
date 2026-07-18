using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;

public static class DeleteCounterpartyHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        IHybridCacheService cache,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var counterparty = await dbContext.Counterparties
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.OwnerId == currentUserId && candidate.IsActive, cancellationToken);
        if (counterparty is null)
        {
            return AppHttpResults.NotFound("Counterparty not found.", "No counterparty matched the specified identifier.");
        }

        counterparty.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);

        await cache.RemoveAsync(CacheConstants.CounterpartiesKey(currentUserId));

        return TypedResults.NoContent();
    }
}
