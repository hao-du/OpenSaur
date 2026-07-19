using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Reports.Dtos;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Reports.Services;

public sealed class ReportService(CashPilotDbContext dbContext)
{
    public async Task<IReadOnlyList<IncomeOutcomeResponseItem>> GetIncomeOutcomeAsync(Guid currentUserId, Guid currencyId, int year, string? tagName, CancellationToken cancellationToken)
    {
        var yearStart = new DateOnly(year, 1, 1);
        var yearEnd = new DateOnly(year, 12, 31);
        var queryStart = yearStart.AddDays(-30);
        var queryEnd = yearEnd.AddDays(30);

        var allTransactions = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId && x.Transaction.CurrencyId == currencyId)
            .Where(x => x.TransactionType != BankAccountMovementType.InitialDeposit && x.TransactionType != BankAccountMovementType.PrincipalReturn)
            .Where(x => x.Transaction.TransactionDate >= queryStart && x.Transaction.TransactionDate <= queryEnd)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                x.Transaction.Amount,
                x.Transaction.Direction,
                TransactionMonth = x.Transaction.TransactionDate.Month,
                CurrencyCode = x.Transaction.Currency.ShortName,
                BankAccountTransactionType = (byte?)x.TransactionType,
                Tags = x.BankAccount.Tags
            })
            .Concat(
                dbContext.TransferTransactions
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.Transfer.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId && x.Transaction.CurrencyId == currencyId)
                    .Where(x => x.Transaction.TransactionDate >= queryStart && x.Transaction.TransactionDate <= queryEnd)
                    .Select(x => new
                    {
                        x.Transaction.TransactionDate,
                        x.Transaction.Amount,
                        x.Transaction.Direction,
                        TransactionMonth = x.Transaction.TransactionDate.Month,
                        CurrencyCode = x.Transaction.Currency.ShortName,
                        BankAccountTransactionType = (byte?)null,
                        Tags = x.Transfer.Tags
                    }))
            .Concat(
                dbContext.CurrencyExchangeTransactions
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.CurrencyExchange.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId && x.Transaction.CurrencyId == currencyId)
                    .Where(x => x.Transaction.TransactionDate >= queryStart && x.Transaction.TransactionDate <= queryEnd)
                    .Select(x => new
                    {
                        x.Transaction.TransactionDate,
                        x.Transaction.Amount,
                        x.Transaction.Direction,
                        TransactionMonth = x.Transaction.TransactionDate.Month,
                        CurrencyCode = x.Transaction.Currency.ShortName,
                        BankAccountTransactionType = (byte?)null,
                        Tags = x.CurrencyExchange.Tags
                    }))
            .Concat(
                dbContext.CashFlows
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId && x.Transaction.CurrencyId == currencyId)
                    .Where(x => x.Transaction.TransactionDate >= queryStart && x.Transaction.TransactionDate <= queryEnd)
                    .Select(x => new
                    {
                        x.Transaction.TransactionDate,
                        x.Transaction.Amount,
                        x.Transaction.Direction,
                        TransactionMonth = x.Transaction.TransactionDate.Month,
                        CurrencyCode = x.Transaction.Currency.ShortName,
                        BankAccountTransactionType = (byte?)null,
                        Tags = x.Tags
                    }))
            .ToListAsync(cancellationToken);

        var taggedTransactions = allTransactions
            .Where(x => TagTermCodec.Decode(x.Tags).Contains(tagName, StringComparer.OrdinalIgnoreCase))
            .ToList();

        if (!taggedTransactions.Any())
        {
            return [];
        }

        var markerDates = taggedTransactions
            .Select(x => x.TransactionDate)
            .Distinct()
            .OrderBy(x => x)
            .ToList();
        var inYearMarkerDates = markerDates
            .Where(x => x >= yearStart && x <= yearEnd)
            .ToList();

        if (!inYearMarkerDates.Any())
        {
            return [];
        }

        var previousMarkerDate = markerDates
            .Where(x => x < yearStart)
            .DefaultIfEmpty(queryStart)
            .Max();

        var nextMarkerDate = markerDates
            .Where(x => x > yearEnd)
            .DefaultIfEmpty(queryEnd)
            .Min();

        var periods = new List<(DateOnly Start, DateOnly? End)>();

        if (previousMarkerDate < inYearMarkerDates[0])
        {
            periods.Add((previousMarkerDate, inYearMarkerDates[0].AddDays(-1)));
        }

        for (var i = 0; i < inYearMarkerDates.Count - 1; i++)
        {
            var start = inYearMarkerDates[i];
            var end = inYearMarkerDates[i + 1].AddDays(-1);
            periods.Add((start, end));
        }

        var lastMarker = inYearMarkerDates.Last();
        if (lastMarker <= nextMarkerDate)
        {
            periods.Add((lastMarker, null));
        }

        var result = new List<(int PeriodIndex, IncomeOutcomeResponseItem Item)>();
        var periodIndex = 0;

        foreach (var (start, end) in periods)
        {
            var periodItems = end != null
                ? allTransactions.Where(x => x.TransactionDate >= start && x.TransactionDate <= end).ToList()
                : allTransactions.Where(x => x.TransactionDate >= start).ToList();

            foreach (var group in periodItems
                .GroupBy(x => x.CurrencyCode)
                .Select(g => new
                {
                    CurrencyCode = g.Key,
                    Income = g.Where(x => x.Direction == TransactionDirection.In).Sum(x => x.Amount),
                    Outcome = g.Where(x => x.Direction == TransactionDirection.Out).Sum(x => x.Amount)
                }))
            {
                var month = start < yearStart ? 1 : start.Month;
                result.Add((periodIndex, new IncomeOutcomeResponseItem(month, group.CurrencyCode, start, end, group.Income, group.Outcome)));
            }

            periodIndex++;
        }

        return result
            .OrderBy(x => x.PeriodIndex)
            .ThenBy(x => x.Item.CurrencyCode)
            .Select(x => x.Item)
            .ToList();
    }
}
