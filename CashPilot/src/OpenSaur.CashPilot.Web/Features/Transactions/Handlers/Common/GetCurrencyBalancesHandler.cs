using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetCurrencyBalancesHandler
{
    public static async Task<Ok<IReadOnlyList<CurrencyBalanceItemResponse>>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.CurrencyBalancesKey(currentUserId);

        if (currentUserId != Guid.Empty)
        {
            var cached = await cacheService.GetAsync<IReadOnlyList<CurrencyBalanceItemResponse>>(cacheKey, cancellationToken);
            if (cached is not null)
            {
                return TypedResults.Ok(cached);
            }
        }

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

        if (currentUserId != Guid.Empty)
        {
            await cacheService.SetAsync(cacheKey, (IReadOnlyList<CurrencyBalanceItemResponse>)currencyBalances, CacheConstants.ShortTtl, cancellationToken);
        }

        return TypedResults.Ok<IReadOnlyList<CurrencyBalanceItemResponse>>(currencyBalances);
    }

    private sealed record CurrencyBalanceRow(string CurrencyCode, decimal SignedAmount);
}
