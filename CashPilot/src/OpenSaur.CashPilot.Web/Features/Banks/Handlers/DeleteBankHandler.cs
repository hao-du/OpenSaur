using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Banks.Handlers;

public static class DeleteBankHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        IHybridCacheService cache,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var bank = await dbContext.Banks
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.OwnerId == currentUserId && candidate.IsActive, cancellationToken);
        if (bank is null)
        {
            return AppHttpResults.NotFound("Bank not found.", "No bank matched the specified identifier.");
        }

        bank.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);

        await cache.RemoveAsync(CacheConstants.BanksKey(currentUserId));

        return TypedResults.NoContent();
    }
}
