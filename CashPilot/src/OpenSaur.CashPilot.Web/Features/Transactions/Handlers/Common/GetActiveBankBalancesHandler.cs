using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetActiveBankBalancesHandler
{
    public static async Task<Ok<IReadOnlyList<BankBalanceResponse>>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.ActiveBankBalancesKey(currentUserId);

        if (currentUserId != Guid.Empty)
        {
            var cached = await cacheService.GetAsync<IReadOnlyList<BankBalanceResponse>>(cacheKey, cancellationToken);
            if (cached is not null)
            {
                return TypedResults.Ok(cached);
            }
        }

        var activeBankRows = await dbContext.BankAccounts
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.Status == BankAccountStatus.Active &&
                x.BankAccountTransactions.Any(bat =>
                    bat.IsActive &&
                    bat.Transaction.IsActive &&
                    bat.Transaction.OwnerId == currentUserId))
            .Select(x => new
            {
                BankName = x.Bank.Name,
                CurrencyCode = x.Currency.ShortName,
                SignedAmount = x.Amount
            })
            .ToListAsync(cancellationToken);

        var activeBankBalances = activeBankRows
            .GroupBy(x => new { x.BankName, x.CurrencyCode })
            .Select(g => new BankBalanceResponse(g.Key.BankName, g.Key.CurrencyCode, g.Sum(x => x.SignedAmount)))
            .OrderBy(x => x.BankName)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        if (currentUserId != Guid.Empty)
        {
            await cacheService.SetAsync(cacheKey, (IReadOnlyList<BankBalanceResponse>)activeBankBalances, CacheConstants.ShortTtl, cancellationToken);
        }

        return TypedResults.Ok<IReadOnlyList<BankBalanceResponse>>(activeBankBalances);
    }
}
