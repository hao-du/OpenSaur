using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Queries.Providers;

internal sealed class CurrencyExchangeTransactionQueryProvider(CashPilotDbContext dbContext) : ITransactionQueryProvider
{
    public string ProviderType => "Exchange";

    public Task<IReadOnlyList<TransactionListItemResponse>> GetListItemsAsync(
        Guid currentUserId,
        TransactionFilterParams filter,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<TransactionListItemResponse>>([]);
    }

    public async Task<IReadOnlyList<TransactionSummaryRow>> GetDashboardRowsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        return await dbContext.CurrencyExchangeTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.CurrencyExchange.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new TransactionSummaryRow(
                x.Transaction.TransactionDate,
                x.Transaction.Currency.ShortName,
                x.Transaction.Direction == Domain.TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TransactionCalendarRow>> GetCalendarRowsAsync(
        Guid currentUserId,
        int year,
        int month,
        Guid defaultCurrencyId,
        CancellationToken cancellationToken)
    {
        return await dbContext.CurrencyExchangeTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.CurrencyExchange.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => x.Transaction.CurrencyId == defaultCurrencyId)
            .Where(x => x.Transaction.TransactionDate.Year == year && x.Transaction.TransactionDate.Month == month)
            .Select(x => new TransactionCalendarRow(
                x.Transaction.TransactionDate.Day,
                x.Transaction.Direction == Domain.TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount))
            .ToListAsync(cancellationToken);
    }
}
