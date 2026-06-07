using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Queries;

public sealed record TransactionSummaryRow(
    DateOnly TransactionDate,
    string CurrencyCode,
    decimal SignedAmount);

public sealed record TransactionCalendarRow(
    int Day,
    decimal SignedAmount);

public interface ITransactionQueryProvider
{
    Task<IReadOnlyList<TransactionListItemResponse>> GetListItemsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TransactionSummaryRow>> GetDashboardRowsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TransactionCalendarRow>> GetCalendarRowsAsync(
        Guid currentUserId,
        int year,
        int month,
        Guid defaultCurrencyId,
        CancellationToken cancellationToken);
}
