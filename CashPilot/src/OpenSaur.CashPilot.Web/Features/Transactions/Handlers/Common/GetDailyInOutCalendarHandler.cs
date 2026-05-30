using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetDailyInOutCalendarHandler
{
    public static async Task<Ok<DailyInOutCalendarResponse>> HandleAsync(
        [AsParameters] DailyInOutCalendarQueryRequest request,
        ClaimsPrincipal user,
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

        var cashFlowRows = await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => x.Transaction.CurrencyId == defaultCurrency.Id)
            .Where(x => x.Transaction.TransactionDate.Year == year && x.Transaction.TransactionDate.Month == month)
            .Select(x => new
            {
                Day = x.Transaction.TransactionDate.Day,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var bankMovementRows = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => x.TransactionType != BankAccountMovementType.InitialDeposit && x.TransactionType != BankAccountMovementType.PrincipalReturn)
            .Where(x => x.Transaction.CurrencyId == defaultCurrency.Id)
            .Where(x => x.Transaction.TransactionDate.Year == year && x.Transaction.TransactionDate.Month == month)
            .Select(x => new
            {
                Day = x.Transaction.TransactionDate.Day,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var transferRows = await dbContext.TransferTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transfer.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => x.Transaction.CurrencyId == defaultCurrency.Id)
            .Where(x => x.Transaction.TransactionDate.Year == year && x.Transaction.TransactionDate.Month == month)
            .Select(x => new
            {
                Day = x.Transaction.TransactionDate.Day,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var exchangeRows = await dbContext.CurrencyExchangeTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.CurrencyExchange.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => x.Transaction.CurrencyId == defaultCurrency.Id)
            .Where(x => x.Transaction.TransactionDate.Year == year && x.Transaction.TransactionDate.Month == month)
            .Select(x => new
            {
                Day = x.Transaction.TransactionDate.Day,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var items = cashFlowRows
            .Concat(bankMovementRows)
            .Concat(transferRows)
            .Concat(exchangeRows)
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
