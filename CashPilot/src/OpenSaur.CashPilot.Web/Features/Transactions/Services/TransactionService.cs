using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Currencies.Services;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Services;

public sealed class TransactionService(CashPilotDbContext dbContext, TagService tagService, CurrencyService currencyService)
{
    public const int UNLIMITED_PERIODS = -1;

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
            .Where(bat => bat.IsActive && bat.Transaction.IsActive && bat.Transaction.OwnerId == currentUserId);

        var cashFlowsQuery = dbContext.CashFlows.AsNoTracking()
            .Where(cf => cf.IsActive && cf.Transaction.IsActive && cf.Transaction.OwnerId == currentUserId);

        var transferTransactionsQuery = dbContext.TransferTransactions.AsNoTracking()
            .Where(tt => tt.IsActive && tt.Transaction.IsActive && tt.Transaction.OwnerId == currentUserId);

        var currencyExchangeTransactionsQuery = dbContext.CurrencyExchangeTransactions.AsNoTracking()
            .Where(cet => cet.IsActive && cet.Transaction.IsActive && cet.Transaction.OwnerId == currentUserId);

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

    public async Task<IReadOnlyList<TransactionListItemResponse>> GetTransactionsByPeriodAsync(
        Guid currentUserId,
        DateOnly? startDate,
        DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        if (startDate is null && endDate is null)
        {
            return [];
        }

        var defaultCurrency = await currencyService.GetDefaultCurrencyAsync(currentUserId, cancellationToken);
        if (defaultCurrency is null)
        {
            return [];
        }

        var results = await LoadIncomeOutcomeRowsAsync(currentUserId, defaultCurrency.Id, startDate, endDate, cancellationToken);
        return results.OrderByDescending(x => x.TransactionDate).ToList();
    }

    public async Task<IncomeOutcomeLatestPeriodsResponse> GetIncomeOutcomeByLatestPeriodsAsync(
        Guid currentUserId,
        bool isMonthly,
        CancellationToken cancellationToken)
    {
        var defaultCurrency = await currencyService.GetDefaultCurrencyAsync(currentUserId, cancellationToken);
        if (defaultCurrency is null)
        {
            return new IncomeOutcomeLatestPeriodsResponse(isMonthly, []);
        }

        IReadOnlyList<MarkerCalendarPeriodResponse> periods;

        if (isMonthly)
        {
            periods = BuildLatestMonthlyPeriods(DateOnly.FromDateTime(DateTime.UtcNow.Date));
        }
        else
        {
            var defaultMarkerTag = await tagService.GetDefaultMarkerTagsAsync(currentUserId, cancellationToken);
            if (defaultMarkerTag is null)
            {
                return new IncomeOutcomeLatestPeriodsResponse(false, []);
            }

            periods = await BuildLatestMarkerPeriodsAsync(currentUserId, defaultCurrency.Id, defaultMarkerTag.Name, 3, cancellationToken);
        }

        if (periods.Count == 0)
        {
            return new IncomeOutcomeLatestPeriodsResponse(isMonthly, []);
        }

        DateOnly? overallStartDate = periods.Any(x => !x.StartDate.HasValue)
            ? null
            : periods.Min(x => x.StartDate!.Value);

        var overallEndDate = periods.Max(x => x.EndDate);
        var rows = await LoadIncomeOutcomeRowsAsync(currentUserId, defaultCurrency.Id, overallStartDate, overallEndDate, cancellationToken);
        if (rows.Count == 0)
        {
            return new IncomeOutcomeLatestPeriodsResponse(isMonthly, []);
        }

        var items = periods
            .Select(period =>
            {
                var periodRows = rows
                    .Where(x => period.StartDate == null || x.TransactionDate >= period.StartDate.Value)
                    .Where(x => period.EndDate == null || x.TransactionDate <= period.EndDate)
                    .ToList();

                return new IncomeOutcomeLatestPeriodItemResponse(
                    period.StartDate,
                    period.EndDate,
                    period.Year,
                    period.Month,
                    periodRows.Where(x => x.Direction == (byte)TransactionDirection.In).Sum(x => x.Amount),
                    periodRows.Where(x => x.Direction == (byte)TransactionDirection.Out).Sum(x => x.Amount));
            })
            .ToList();

        return new IncomeOutcomeLatestPeriodsResponse(isMonthly, items);
    }

    private static IReadOnlyList<MarkerCalendarPeriodResponse> BuildLatestMonthlyPeriods(DateOnly today)
    {
        var periods = new List<MarkerCalendarPeriodResponse>();
        var currentMonthStart = new DateOnly(today.Year, today.Month, 1);

        for (var i = 0; i < 3; i++)
        {
            var startDate = currentMonthStart.AddMonths(-i);
            periods.Add(new MarkerCalendarPeriodResponse(
                startDate,
                startDate.AddMonths(1).AddDays(-1),
                startDate.Year,
                startDate.Month));
        }

        return periods;
    }

    public async Task<IReadOnlyList<MarkerCalendarPeriodResponse>> BuildLatestMarkerPeriodsAsync(
        Guid currentUserId,
        Guid defaultCurrencyId,
        string defaultMakerTagName,
        int numberOfPeriods,
        CancellationToken cancellationToken)
    {
        var markerDates = await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId && x.Transaction.CurrencyId == defaultCurrencyId)
            .Where(x => EF.Functions.JsonContains(x.Tags, $"[\"{defaultMakerTagName}\"]"))
            .Select(x => x.Transaction.TransactionDate)
            .Concat(
                dbContext.BankAccountTransactions
                    .AsNoTracking()
                    .Where(x =>
                        x.IsActive &&
                        x.Transaction.IsActive &&
                        x.Transaction.OwnerId == currentUserId &&
                        x.Transaction.CurrencyId == defaultCurrencyId &&
                        x.TransactionType == BankAccountMovementType.InterestPayment)
                    .Where(x => EF.Functions.JsonContains(x.BankAccount.Tags, $"[\"{defaultMakerTagName}\"]"))
                    .Select(x => x.Transaction.TransactionDate))
            .Concat(
                dbContext.TransferTransactions
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId && x.Transaction.CurrencyId == defaultCurrencyId)
                    .Where(x => EF.Functions.JsonContains(x.Transfer.Tags, $"[\"{defaultMakerTagName}\"]"))
                    .Select(x => x.Transaction.TransactionDate))
            .Concat(
                dbContext.CurrencyExchangeTransactions
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId && x.Transaction.CurrencyId == defaultCurrencyId)
                    .Where(x => EF.Functions.JsonContains(x.CurrencyExchange.Tags, $"[\"{defaultMakerTagName}\"]"))
                    .Select(x => x.Transaction.TransactionDate))
            .ToListAsync(cancellationToken);

        if (markerDates.Count == 0)
        {
            return [];
        }

        var periods = BuildPeriods([.. markerDates.Distinct().OrderBy(x => x)], DateOnly.FromDateTime(DateTime.UtcNow.Date));
        if (periods.Count == 0)
        {
            return [];
        }

        if (numberOfPeriods == UNLIMITED_PERIODS)
        {
            return periods.ToList();
        }

        return periods
            .TakeLast(numberOfPeriods)
            .ToList();
    }

    public async Task<List<TransactionListItemResponse>> LoadIncomeOutcomeRowsAsync(
        Guid currentUserId,
        Guid? currencyId,
        DateOnly? startDate,
        DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var rows = new List<TransactionListItemResponse>();
        var includeAllBankAccountRows = !currencyId.HasValue;

        var cashFlowRows = await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => !currencyId.HasValue || x.Transaction.CurrencyId == currencyId.Value)
            .Where(x => !startDate.HasValue || x.Transaction.TransactionDate >= startDate.Value)
            .Where(x => !endDate.HasValue || x.Transaction.TransactionDate <= endDate.Value)
            .Select(cf => new TransactionListItemResponse(
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
                cf.Transaction.Description,
                TagTermCodec.Decode(cf.Tags),
                cf.Transaction.Currency.ShortName,
                cf.Transaction.Amount,
                (byte)cf.Transaction.Direction,
                cf.Transaction.TransactionDate,
                cf.IsActive))
            .ToListAsync(cancellationToken);
        rows.AddRange(cashFlowRows);

        var bankAccountRows = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.Transaction.IsActive &&
                x.Transaction.OwnerId == currentUserId &&
                (!currencyId.HasValue || x.Transaction.CurrencyId == currencyId.Value) &&
                (includeAllBankAccountRows
                    ? x.TransactionType != BankAccountMovementType.InitialDeposit && x.TransactionType != BankAccountMovementType.PrincipalReturn
                    : x.TransactionType == BankAccountMovementType.InterestPayment))
            .Where(x => !startDate.HasValue || x.Transaction.TransactionDate >= startDate.Value)
            .Where(x => !endDate.HasValue || x.Transaction.TransactionDate <= endDate.Value)
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
                bat.BankAccount.IsActive))
            .ToListAsync(cancellationToken);
        rows.AddRange(bankAccountRows);

        var transferRows = await dbContext.TransferTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => !currencyId.HasValue || x.Transaction.CurrencyId == currencyId.Value)
            .Where(x => !startDate.HasValue || x.Transaction.TransactionDate >= startDate.Value)
            .Where(x => !endDate.HasValue || x.Transaction.TransactionDate <= endDate.Value)
            .Select(tt => new TransactionListItemResponse(
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
                tt.Transfer.Description ?? tt.Description ?? tt.Transaction.Description,
                TagTermCodec.Decode(tt.Transfer.Tags),
                tt.Transaction.Currency.ShortName,
                tt.Transaction.Amount,
                (byte)tt.Transaction.Direction,
                tt.Transaction.TransactionDate,
                tt.Transfer.IsActive))
            .ToListAsync(cancellationToken);
        rows.AddRange(transferRows);

        var exchangeRows = await dbContext.CurrencyExchangeTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => !currencyId.HasValue || x.Transaction.CurrencyId == currencyId.Value)
            .Where(x => !startDate.HasValue || x.Transaction.TransactionDate >= startDate.Value)
            .Where(x => !endDate.HasValue || x.Transaction.TransactionDate <= endDate.Value)
            .Select(cet => new TransactionListItemResponse(
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
                cet.Transaction.Description,
                TagTermCodec.Decode(cet.CurrencyExchange.Tags),
                cet.Transaction.Currency.ShortName,
                cet.Transaction.Amount,
                (byte)cet.Transaction.Direction,
                cet.Transaction.TransactionDate,
                cet.CurrencyExchange.IsActive))
            .ToListAsync(cancellationToken);
        rows.AddRange(exchangeRows);

        return rows;
    }

    public static IReadOnlyList<MarkerCalendarPeriodResponse> BuildPeriods(
        IReadOnlyList<DateOnly> markerDates,
        DateOnly today)
    {
        var periods = new List<MarkerCalendarPeriodResponse>();

        if (markerDates.Count == 0)
        {
            return periods;
        }

        periods.Add(new MarkerCalendarPeriodResponse(null, markerDates[0].AddDays(-1), null, null));

        for (var i = 0; i < markerDates.Count - 1; i++)
        {
            periods.Add(new MarkerCalendarPeriodResponse(
                markerDates[i],
                markerDates[i + 1].AddDays(-1),
                null,
                null));
        }

        var lastMarkerDate = markerDates[^1];
        periods.Add(new MarkerCalendarPeriodResponse(
            lastMarkerDate,
            lastMarkerDate > today ? lastMarkerDate : today,
            null,
            null));

        return periods;
    }
}
