using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionsHandler
{
    public static async Task<Ok<IReadOnlyList<TransactionListItemResponse>>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var cashFlow = await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new TransactionListItemResponse(
                x.Id,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
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
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new TransactionListItemResponse(
                x.BankAccountId,
                x.BankAccountId,
                null,
                null,
                x.BankAccount.Bank.ShortName,
                (byte)x.BankAccount.Status,
                (byte)x.TransactionType,
                null,
                null,
                null,
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
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new TransactionListItemResponse(
                x.TransferId,
                null,
                x.TransferId,
                null,
                null,
                null,
                null,
                x.Transfer.Counterparty.FullName,
                (byte)x.Transfer.Status,
                (byte)x.Transfer.TransferType,
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
            .Where(x => x.IsActive
                && x.CurrencyExchange.IsActive
                && x.Transaction.IsActive
                && x.Transaction.OwnerId == currentUserId)
            .Select(x => new TransactionListItemResponse(
                x.CurrencyExchangeId,
                null,
                null,
                x.CurrencyExchangeId,
                null,
                null,
                null,
                null,
                null,
                null,
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
