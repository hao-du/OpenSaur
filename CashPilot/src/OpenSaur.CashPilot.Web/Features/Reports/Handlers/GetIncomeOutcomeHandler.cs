using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Reports.Dtos;
using OpenSaur.CashPilot.Web.Features.Reports.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Reports.Handlers;

public static class GetIncomeOutcomeHandler
{
    public static async Task<Ok<IncomeOutcomeResponse>> HandleAsync(
        [AsParameters] GetIncomeOutcomeQueryRequest request,
        ClaimsPrincipal user,
        TransactionService transactionService,
        ReportService reportService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var year = request.Year;
        var tagName = request.TagName?.Trim();

        var defaultCurrency = await dbContext.Currencies
            .AsNoTracking()
            .Where(x => x.OwnerId == currentUserId && x.IsActive && x.IsDefault)
            .FirstOrDefaultAsync(cancellationToken);

        var defaultCurrencyShortName = defaultCurrency?.ShortName ?? string.Empty;
        IReadOnlyList<IncomeOutcomeResponseItem> monthlyResult;

        if (defaultCurrency == null)
        {
            monthlyResult = [];
        }
        else if (string.IsNullOrWhiteSpace(tagName))
        {
            var startOfYear = new DateOnly(year, 1, 1);
            var endOfYear = new DateOnly(year, 12, 31);
            var rows = await transactionService.LoadIncomeOutcomeRowsAsync(
                currentUserId,
                null,
                startOfYear,
                endOfYear,
                cancellationToken);
            var monthLabels = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };

            monthlyResult = rows
                .GroupBy(x => new { x.TransactionDate.Month, x.CurrencyCode })
                .Select(g =>
                {
                    var startDate = new DateOnly(year, g.Key.Month, 1);
                    var endDate = new DateOnly(year, g.Key.Month, DateTime.DaysInMonth(year, g.Key.Month));

                    return new IncomeOutcomeResponseItem(
                        g.Key.Month,
                        g.Key.CurrencyCode,
                        monthLabels[g.Key.Month - 1],
                        startDate,
                        endDate,
                        g.Where(x => x.Direction == (byte)TransactionDirection.In).Sum(x => x.Amount),
                        g.Where(x => x.Direction == (byte)TransactionDirection.Out).Sum(x => x.Amount));
                })
                .OrderBy(x => x.Month)
                .ThenBy(x => x.CurrencyCode)
                .ToList();
        }
        else
        {
            monthlyResult = await reportService.GetIncomeOutcomeAsync(currentUserId, defaultCurrency.Id, year, tagName, cancellationToken);
        }

        return TypedResults.Ok(new IncomeOutcomeResponse(year, defaultCurrencyShortName, monthlyResult));
    }
}
