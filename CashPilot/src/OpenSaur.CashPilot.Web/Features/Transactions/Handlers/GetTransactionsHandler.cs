using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionsHandler
{
    public static async Task<Ok<IReadOnlyList<TransactionListItemResponse>>> HandleAsync(
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var cashFlow = await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive)
            .Select(x => new TransactionListItemResponse(
                x.Id,
                "CashFlow",
                x.Description,
                x.Transaction.Currency.ShortName,
                x.Transaction.Amount,
                (byte)x.Transaction.Direction,
                x.Transaction.TransactionDate,
                x.IsActive))
            .ToListAsync(cancellationToken);

        var bank = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive)
            .Select(x => new TransactionListItemResponse(
                x.Id,
                "BankAccount",
                x.Description,
                x.Transaction.Currency.ShortName,
                x.Transaction.Amount,
                (byte)x.Transaction.Direction,
                x.Transaction.TransactionDate,
                x.IsActive))
            .ToListAsync(cancellationToken);

        var transfer = await dbContext.TransferTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive)
            .Select(x => new TransactionListItemResponse(
                x.Id,
                "Transfer",
                x.Description,
                x.Transaction.Currency.ShortName,
                x.Transaction.Amount,
                (byte)x.Transaction.Direction,
                x.Transaction.TransactionDate,
                x.IsActive))
            .ToListAsync(cancellationToken);

        var exchange = await dbContext.CurrencyExchangeTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive)
            .Select(x => new TransactionListItemResponse(
                x.CurrencyExchangeId,
                "Exchange",
                x.Description,
                x.Transaction.Currency.ShortName,
                x.Transaction.Amount,
                (byte)x.Transaction.Direction,
                x.Transaction.TransactionDate,
                x.IsActive))
            .ToListAsync(cancellationToken);

        var result = cashFlow
            .Concat(bank)
            .Concat(transfer)
            .Concat(exchange)
            .OrderByDescending(x => x.TransactionDate)
            .ThenByDescending(x => x.Id)
            .ToList();

        return TypedResults.Ok<IReadOnlyList<TransactionListItemResponse>>(result);
    }
}
