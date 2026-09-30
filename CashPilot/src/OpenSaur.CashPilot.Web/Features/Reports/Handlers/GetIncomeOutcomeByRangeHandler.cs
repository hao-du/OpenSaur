using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Reports.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Reports.Handlers;

public static class GetIncomeOutcomeByRangeHandler
{
    public static async Task<Ok<DateRangeIncomeOutcomeResponse>> HandleAsync(
        [AsParameters] GetIncomeOutcomeByRangeQueryRequest request,
        ClaimsPrincipal user,
        TransactionService transactionService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var fromDate = request.FromDate;
        var toDate = request.ToDate;

        var defaultCurrency = await dbContext.Currencies
            .AsNoTracking()
            .Where(x => x.OwnerId == currentUserId && x.IsActive && x.IsDefault)
            .FirstOrDefaultAsync(cancellationToken);

        var defaultCurrencyShortName = defaultCurrency?.ShortName ?? string.Empty;

        if (defaultCurrency == null || fromDate > toDate)
        {
            return TypedResults.Ok(new DateRangeIncomeOutcomeResponse(fromDate, toDate, defaultCurrencyShortName, []));
        }

        var rows = await transactionService.LoadIncomeOutcomeRowsAsync(
            currentUserId,
            defaultCurrency.Id,
            fromDate,
            toDate,
            cancellationToken);

        var monthlyResult = rows
            .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month, x.CurrencyCode })
            .Select(g =>
            {
                var startDate = new DateOnly(g.Key.Year, g.Key.Month, 1);
                var daysInMonth = DateTime.DaysInMonth(g.Key.Year, g.Key.Month);
                var endDate = new DateOnly(g.Key.Year, g.Key.Month, daysInMonth);

                return new DateRangeIncomeOutcomeResponseItem(
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.CurrencyCode,
                    startDate,
                    endDate,
                    g.Where(x => x.Direction == (byte)TransactionDirection.In).Sum(x => x.Amount),
                    g.Where(x => x.Direction == (byte)TransactionDirection.Out).Sum(x => x.Amount));
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        var response = new DateRangeIncomeOutcomeResponse(fromDate, toDate, defaultCurrencyShortName, monthlyResult);
        return TypedResults.Ok(response);
    }
}
