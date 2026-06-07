using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetDailyInOutCalendarHandler
{
    public static async Task<Ok<DailyInOutCalendarResponse>> HandleAsync(
        [AsParameters] DailyInOutCalendarQueryRequest request,
        ClaimsPrincipal user,
        IEnumerable<ITransactionQueryProvider> transactionQueryProviders,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var now = DateTime.UtcNow;
        var year = request.Year.GetValueOrDefault(now.Year);
        var month = request.Month.GetValueOrDefault(now.Month);

        if (month is < 1 or > 12)
        {
            month = now.Month;
        }

        var defaultCurrency = await dbContext.Currencies
            .AsNoTracking()
            .Where(x => x.OwnerId == currentUserId && x.IsActive && x.IsDefault)
            .Select(x => new { x.Id, x.ShortName })
            .FirstOrDefaultAsync(cancellationToken);

        if (defaultCurrency is null)
        {
            return TypedResults.Ok(new DailyInOutCalendarResponse(year, month, null, []));
        }

        var items = (await transactionQueryProviders.GetCalendarRowsAsync(
                currentUserId,
                year,
                month,
                defaultCurrency.Id,
                cancellationToken))
            .GroupBy(x => x.Day)
            .Select(g => new DailyInOutCalendarItemResponse(
                g.Key,
                g.Where(x => x.SignedAmount > 0).Sum(x => x.SignedAmount),
                g.Where(x => x.SignedAmount < 0).Sum(x => -x.SignedAmount)))
            .OrderBy(x => x.Day)
            .ToList();

        return TypedResults.Ok(new DailyInOutCalendarResponse(year, month, defaultCurrency.ShortName, items));
    }
}


