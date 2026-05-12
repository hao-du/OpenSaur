using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class DeleteCurrencyExchangeHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.CurrencyExchanges.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (entity is null)
        {
            return AppHttpResults.NotFound("CurrencyExchange not found.", "No CurrencyExchange matched the specified identifier.");
        }

        entity.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.NoContent();
    }
}
