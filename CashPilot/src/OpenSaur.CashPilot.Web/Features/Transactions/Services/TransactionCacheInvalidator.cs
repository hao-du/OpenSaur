using OpenSaur.CashPilot.Web.Infrastructure.Caching;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Services;

public interface ITransactionCacheInvalidator
{
    ValueTask InvalidateDashboardAndReportsAsync(Guid userId, CancellationToken cancellationToken = default);
}

public class TransactionCacheInvalidator(ICacheService cacheService) : ITransactionCacheInvalidator
{
    public async ValueTask InvalidateDashboardAndReportsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            return;
        }

        // Invalidate dashboard analytics & balances
        await cacheService.RemoveAsync(CacheConstants.CurrencyBalancesKey(userId), cancellationToken);
        await cacheService.RemoveAsync(CacheConstants.ActiveBankBalancesKey(userId), cancellationToken);
        await cacheService.RemoveAsync(CacheConstants.IncomeOutcomeLatestPeriodsKey(userId, isMonthly: true), cancellationToken);
        await cacheService.RemoveAsync(CacheConstants.IncomeOutcomeLatestPeriodsKey(userId, isMonthly: false), cancellationToken);

        // Note: For marker periods and year-based reports, removing the specific common keys or letting short TTL expire ensures consistency
    }
}

