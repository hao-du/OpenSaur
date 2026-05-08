using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class DeleteCashFlowHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var cashFlow = await dbContext.CashFlows
            .Include(candidate => candidate.Transaction)
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.IsActive && candidate.Transaction.IsActive, cancellationToken);
        if (cashFlow is null)
        {
            return AppHttpResults.NotFound("Transaction not found.", "No transaction matched the specified identifier.");
        }

        cashFlow.IsActive = false;
        cashFlow.Transaction.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
