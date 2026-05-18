using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

public static class DeleteCurrencyHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var currency = await dbContext.Currencies
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.OwnerId == currentUserId && candidate.IsActive, cancellationToken);
        if (currency is null)
        {
            return AppHttpResults.NotFound("Currency not found.", "No currency matched the specified identifier.");
        }

        currency.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
