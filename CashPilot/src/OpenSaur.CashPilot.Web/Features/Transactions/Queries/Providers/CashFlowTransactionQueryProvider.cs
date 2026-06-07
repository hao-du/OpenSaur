using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Queries.Providers;

internal sealed class CashFlowTransactionQueryProvider(CashPilotDbContext dbContext) : ITransactionQueryProvider
{
    public async Task<IReadOnlyList<TransactionListItemResponse>> GetListItemsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        return await dbContext.CashFlows
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
                TagTermCodec.Decode(x.Tags),
                x.Transaction.Currency.ShortName,
                x.Transaction.Amount,
                (byte)x.Transaction.Direction,
                x.Transaction.TransactionDate,
                x.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TransactionSummaryRow>> GetDashboardRowsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        return await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
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
        return await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => x.Transaction.CurrencyId == defaultCurrencyId)
            .Where(x => x.Transaction.TransactionDate.Year == year && x.Transaction.TransactionDate.Month == month)
            .Select(x => new TransactionCalendarRow(
                x.Transaction.TransactionDate.Day,
                x.Transaction.Direction == Domain.TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount))
            .ToListAsync(cancellationToken);
    }
}
