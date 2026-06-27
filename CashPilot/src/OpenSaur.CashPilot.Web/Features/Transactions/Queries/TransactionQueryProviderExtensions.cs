using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Queries;

internal static class TransactionQueryProviderExtensions
{
    public static async Task<List<TransactionListItemResponse>> GetListItemsAsync(
        this IEnumerable<ITransactionQueryProvider> providers,
        Guid currentUserId,
        TransactionFilterParams filter,
        CancellationToken cancellationToken)
    {
        var result = new List<TransactionListItemResponse>();
        foreach (var provider in providers)
        {
            result.AddRange(await provider.GetListItemsAsync(currentUserId, filter, cancellationToken));
        }

        return result;
    }

    public static async Task<List<TransactionSummaryRow>> GetDashboardRowsAsync(
        this IEnumerable<ITransactionQueryProvider> providers,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var result = new List<TransactionSummaryRow>();
        foreach (var provider in providers)
        {
            result.AddRange(await provider.GetDashboardRowsAsync(currentUserId, cancellationToken));
        }

        return result;
    }

    public static async Task<List<TransactionCalendarRow>> GetCalendarRowsAsync(
        this IEnumerable<ITransactionQueryProvider> providers,
        Guid currentUserId,
        int year,
        int month,
        Guid defaultCurrencyId,
        CancellationToken cancellationToken)
    {
        var result = new List<TransactionCalendarRow>();
        foreach (var provider in providers)
        {
            result.AddRange(await provider.GetCalendarRowsAsync(
                currentUserId,
                year,
                month,
                defaultCurrencyId,
                cancellationToken));
        }

        return result;
    }
}
