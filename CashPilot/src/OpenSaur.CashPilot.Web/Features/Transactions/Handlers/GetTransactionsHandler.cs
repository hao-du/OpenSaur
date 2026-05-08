using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionsHandler
{
    public static async Task<Ok<IReadOnlyList<TransactionResponse>>> HandleAsync(
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.CashFlows
            .AsNoTracking()
            .Where(cashFlow => cashFlow.IsActive && cashFlow.Transaction.IsActive)
            .OrderByDescending(cashFlow => cashFlow.Transaction.TransactedOn)
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
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<TransactionResponse>>(result);
    }
}
