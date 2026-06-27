using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Queries.Providers;

internal sealed class TransactionQueryProvider(CashPilotDbContext dbContext) : ITransactionQueryProvider
{
    public string ProviderType => "Unified";

    public async Task<IReadOnlyList<TransactionListItemResponse>> GetListItemsAsync(
        Guid currentUserId,
        TransactionFilterParams filter,
        CancellationToken cancellationToken)
    {
        if (filter.ShowOnlyInitialDeposits)
        {
            return await dbContext.BankAccountTransactions
                .AsNoTracking()
                .Where(bat =>
                    bat.Transaction.IsActive &&
                    bat.Transaction.OwnerId == currentUserId &&
                    bat.TransactionType == BankAccountMovementType.InitialDeposit &&
                    bat.BankAccount.Status == BankAccountStatus.Active)
                .OrderByDescending(bat => bat.Transaction.TransactionDate)
                .Select(bat => new TransactionListItemResponse(
                    bat.BankAccountId,
                    bat.BankAccountId,
                    null,
                    null,
                    bat.BankAccount.Bank.ShortName,
                    (byte)bat.BankAccount.Status,
                    (byte)bat.TransactionType,
                    null,
                    null,
                    null,
                    "BankAccount",
                    bat.Transaction.Description,
                    TagTermCodec.Decode(bat.BankAccount.Tags),
                    bat.Transaction.Currency.ShortName,
                    bat.Transaction.Amount,
                    (byte)bat.Transaction.Direction,
                    bat.Transaction.TransactionDate,
                    bat.Transaction.IsActive))
                .ToListAsync(cancellationToken);
        }

        var query = dbContext.Transactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.OwnerId == currentUserId);

        if (!string.IsNullOrEmpty(filter.Description))
        {
            var normalizedDescription = filter.Description.Trim().ToLower();
            query = query.Where(x => (x.Description ?? "").ToLower().Contains(normalizedDescription));
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(x => x.TransactionDate >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(x => x.TransactionDate <= filter.ToDate.Value);
        }

        var bankAccountTransactionsQuery = dbContext.BankAccountTransactions.AsNoTracking()
            .Where(bat => bat.Transaction.IsActive && bat.Transaction.OwnerId == currentUserId);

        var cashFlowsQuery = dbContext.CashFlows.AsNoTracking()
            .Where(cf => cf.Transaction.IsActive && cf.Transaction.OwnerId == currentUserId);
        
        var transferTransactionsQuery = dbContext.TransferTransactions.AsNoTracking()
            .Where(tt => tt.Transaction.IsActive && tt.Transaction.OwnerId == currentUserId);
        
        var currencyExchangeTransactionsQuery = dbContext.CurrencyExchangeTransactions.AsNoTracking()
            .Where(cet => cet.Transaction.IsActive && cet.Transaction.OwnerId == currentUserId);

        var results = new List<TransactionListItemResponse>();

        if (filter.Types.Length == 0 || filter.Types.Contains("BankAccount"))
        {
            var bankAccountResults = await query
                .Join(bankAccountTransactionsQuery, t => t.Id, bat => bat.TransactionId, (t, bat) => new TransactionListItemResponse(
                    bat.BankAccountId,
                    bat.BankAccountId,
                    null,
                    null,
                    bat.BankAccount.Bank.ShortName,
                    (byte)bat.BankAccount.Status,
                    (byte)bat.TransactionType,
                    null,
                    null,
                    null,
                    "BankAccount",
                    t.Description,
                    TagTermCodec.Decode(bat.BankAccount.Tags),
                    t.Currency.ShortName,
                    t.Amount,
                    (byte)t.Direction,
                    t.TransactionDate,
                    t.IsActive))
                .ToListAsync(cancellationToken);

            results.AddRange(bankAccountResults);
        }

        if (filter.Types.Length == 0 || filter.Types.Contains("CashFlow"))
        {
            var cashFlowResults = await query
                .Join(cashFlowsQuery, t => t.Id, cf => cf.TransactionId, (t, cf) => new TransactionListItemResponse(
                    cf.Id,
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
                    t.Description,
                    TagTermCodec.Decode(cf.Tags),
                    t.Currency.ShortName,
                    t.Amount,
                    (byte)t.Direction,
                    t.TransactionDate,
                    t.IsActive))
                .ToListAsync(cancellationToken);

            results.AddRange(cashFlowResults);
        }

        if (filter.Types.Length == 0 || filter.Types.Contains("Transfer"))
        {
            var transferResults = await query
                .Join(transferTransactionsQuery, t => t.Id, tt => tt.TransactionId, (t, tt) => new TransactionListItemResponse(
                    tt.TransferId,
                    null,
                    tt.TransferId,
                    null,
                    null,
                    null,
                    null,
                    tt.Transfer.Counterparty.FullName,
                    (byte)tt.Transfer.Status,
                    (byte)tt.Transfer.TransferType,
                    "Transfer",
                    tt.Transfer.Description ?? tt.Description ?? t.Description,
                    TagTermCodec.Decode(tt.Transfer.Tags),
                    t.Currency.ShortName,
                    t.Amount,
                    (byte)t.Direction,
                    t.TransactionDate,
                    t.IsActive))
                .ToListAsync(cancellationToken);

            results.AddRange(transferResults);
        }

        if (filter.Types.Length == 0 || filter.Types.Contains("Exchange"))
        {
            var exchangeResults = await query
                .Join(currencyExchangeTransactionsQuery, t => t.Id, cet => cet.TransactionId, (t, cet) => new TransactionListItemResponse(
                    cet.CurrencyExchangeId,
                    null,
                    null,
                    cet.CurrencyExchangeId,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Exchange",
                    t.Description,
                    TagTermCodec.Decode(cet.CurrencyExchange.Tags),
                    t.Currency.ShortName,
                    t.Amount,
                    (byte)t.Direction,
                    t.TransactionDate,
                    t.IsActive))
                .ToListAsync(cancellationToken);

            results.AddRange(exchangeResults);
        }

        return results.OrderByDescending(x => x.TransactionDate).ToList();
    }

    public async Task<IReadOnlyList<TransactionSummaryRow>> GetDashboardRowsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        return [];
    }

    public async Task<IReadOnlyList<TransactionCalendarRow>> GetCalendarRowsAsync(
        Guid currentUserId,
        int year,
        int month,
        Guid defaultCurrencyId,
        CancellationToken cancellationToken)
    {
        return [];
    }
}
