using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetCashFlowByIdHandler
{
    public static async Task<Results<Ok<TransactionResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.CashFlows
            .AsNoTracking()
            .Where(cashFlow => cashFlow.Id == id && cashFlow.IsActive && cashFlow.Transaction.IsActive)
            .Select(cashFlow => new TransactionResponse(
                cashFlow.Id,
                cashFlow.Transaction.Amount,
                cashFlow.Transaction.CurrencyId,
                cashFlow.Transaction.Currency.Name,
                cashFlow.Transaction.Description,
                cashFlow.IsIncome,
                cashFlow.Transaction.TransactedOn,
                "CashFlow"
            ))
            .SingleOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return AppHttpResults.NotFound("Transaction not found.", "No transaction matched the specified identifier.");
        }

        return TypedResults.Ok(result);
    }
}
