using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetMarkerCalendarHandler
{
    public static async Task<Ok<MarkerCalendarResponse>> HandleAsync(
        [AsParameters] MarkerCalendarQueryRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var tagName = request.TagName.Trim();

        if (string.IsNullOrWhiteSpace(tagName))
        {
            return TypedResults.Ok(new MarkerCalendarResponse(string.Empty, 0, [], []));
        }

        var transactions = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                x.Transaction.Amount,
                x.Transaction.Direction,
                BankAccountTransactionType = (byte?)x.TransactionType,
                Tags = x.BankAccount.Tags
            })
            .Concat(
                dbContext.TransferTransactions
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
                    .Select(x => new
                    {
                        x.Transaction.TransactionDate,
                        x.Transaction.Amount,
                        x.Transaction.Direction,
                        BankAccountTransactionType = (byte?)null,
                        Tags = x.Transfer.Tags
                    }))
            .Concat(
                dbContext.CurrencyExchangeTransactions
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
                    .Select(x => new
                    {
                        x.Transaction.TransactionDate,
                        x.Transaction.Amount,
                        x.Transaction.Direction,
                        BankAccountTransactionType = (byte?)null,
                        Tags = x.CurrencyExchange.Tags
                    }))
            .Concat(
                dbContext.CashFlows
                    .AsNoTracking()
                    .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
                    .Select(x => new
                    {
                        x.Transaction.TransactionDate,
                        x.Transaction.Amount,
                        x.Transaction.Direction,
                        BankAccountTransactionType = (byte?)null,
                        x.Tags
                    }))
            .ToListAsync(cancellationToken);

        var markerTransactions = transactions
            .Where(x => TagTermCodec.Decode(x.Tags).Contains(tagName, StringComparer.OrdinalIgnoreCase))
            .OrderBy(x => x.TransactionDate)
            .ToList();

        if (markerTransactions.Count == 0)
        {
            return TypedResults.Ok(new MarkerCalendarResponse(tagName, 0, [], []));
        }

        var markerDates = markerTransactions
            .Select(x => x.TransactionDate)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var periods = BuildPeriods(markerDates, today);

        if (periods.Count == 0)
        {
            return TypedResults.Ok(new MarkerCalendarResponse(tagName, 0, [], []));
        }

        var selectedPeriodIndex = request.PeriodIndex.GetValueOrDefault(periods.Count - 1);
        if (selectedPeriodIndex < 0)
        {
            selectedPeriodIndex = 0;
        }
        else if (selectedPeriodIndex >= periods.Count)
        {
            selectedPeriodIndex = periods.Count - 1;
        }

        var selectedPeriod = periods[selectedPeriodIndex];
        var items = transactions
            .Where(x => selectedPeriod.StartDate == null || x.TransactionDate >= selectedPeriod.StartDate.Value)
            .Where(x => x.TransactionDate <= selectedPeriod.EndDate)
            .Where(x =>
                x.BankAccountTransactionType != (byte)BankAccountMovementType.InitialDeposit &&
                x.BankAccountTransactionType != (byte)BankAccountMovementType.PrincipalReturn)
            .GroupBy(x => x.TransactionDate)
            .Select(g => new MarkerCalendarItemResponse(
                g.Key,
                g.Where(x => x.Direction == TransactionDirection.In).Sum(x => x.Amount),
                g.Where(x => x.Direction == TransactionDirection.Out).Sum(x => x.Amount)))
            .OrderBy(x => x.TransactionDate)
            .ToList();

        return TypedResults.Ok(new MarkerCalendarResponse(tagName, selectedPeriodIndex, periods, items));
    }

    private static IReadOnlyList<MarkerCalendarPeriodResponse> BuildPeriods(
        IReadOnlyList<DateOnly> markerDates,
        DateOnly today)
    {
        var periods = new List<MarkerCalendarPeriodResponse>();

        if (markerDates.Count == 0)
        {
            return periods;
        }

        periods.Add(new MarkerCalendarPeriodResponse(null, markerDates[0].AddDays(-1)));

        for (var i = 0; i < markerDates.Count - 1; i++)
        {
            periods.Add(new MarkerCalendarPeriodResponse(
                markerDates[i],
                markerDates[i + 1].AddDays(-1)));
        }

        var lastMarkerDate = markerDates[^1];
        periods.Add(new MarkerCalendarPeriodResponse(
            lastMarkerDate,
            lastMarkerDate > today ? lastMarkerDate : today));

        return periods;
    }

}
