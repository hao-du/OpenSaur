using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetCurrencyBalancesHandler
{
    public static async Task<Ok<IReadOnlyList<CurrencyBalanceItemResponse>>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var rows = new List<CurrencyBalanceRow>();

        rows.AddRange(await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new CurrencyBalanceRow(
                x.Transaction.Currency.ShortName,
                x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount))
            .ToListAsync(cancellationToken));

        rows.AddRange(await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.Transaction.IsActive &&
                x.Transaction.OwnerId == currentUserId &&
                x.TransactionType != BankAccountMovementType.InitialDeposit &&
                x.TransactionType != BankAccountMovementType.PrincipalReturn)
            .Select(x => new CurrencyBalanceRow(
                x.Transaction.Currency.ShortName,
                x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount))
            .ToListAsync(cancellationToken));

        rows.AddRange(await dbContext.TransferTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transfer.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new CurrencyBalanceRow(
                x.Transaction.Currency.ShortName,
                x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount))
            .ToListAsync(cancellationToken));

        rows.AddRange(await dbContext.CurrencyExchangeTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.CurrencyExchange.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new CurrencyBalanceRow(
                x.Transaction.Currency.ShortName,
                x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount))
            .ToListAsync(cancellationToken));

        var currencyBalances = rows
            .GroupBy(x => x.CurrencyCode)
            .Select(g => new CurrencyBalanceItemResponse(g.Key, g.Sum(x => x.SignedAmount)))
            .OrderBy(x => x.CurrencyCode)
            .ToList();

        return TypedResults.Ok<IReadOnlyList<CurrencyBalanceItemResponse>>(currencyBalances);
    }

    private sealed record CurrencyBalanceRow(string CurrencyCode, decimal SignedAmount);
}
