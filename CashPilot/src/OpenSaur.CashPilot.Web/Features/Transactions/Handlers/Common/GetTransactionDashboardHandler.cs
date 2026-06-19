using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionDashboardHandler
{
    public static async Task<Ok<TransactionDashboardResponse>> HandleAsync(
        ClaimsPrincipal user,
        IEnumerable<ITransactionQueryProvider> transactionQueryProviders,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var transactionRows = await transactionQueryProviders.GetDashboardRowsAsync(currentUserId, cancellationToken);

        var currencyBalances = transactionRows
            .GroupBy(x => x.CurrencyCode)
            .Select(g => new CurrencyBalanceItemResponse(g.Key, g.Sum(x => x.SignedAmount)))
            .OrderBy(x => x.CurrencyCode)
            .ToList();

        var activeBankRows = await dbContext.BankAccounts
            .AsNoTracking()
            .Where(x => x.IsActive
                && x.Status == BankAccountStatus.Active
                && x.BankAccountTransactions.Any(bat => bat.IsActive && bat.Transaction.IsActive && bat.Transaction.OwnerId == currentUserId))
            .Select(x => new
            {
                BankName = x.Bank.Name,
                CurrencyCode = x.Currency.ShortName,
                SignedAmount = x.Amount
            })
            .ToListAsync(cancellationToken);

        var activeBankBalances = activeBankRows
            .GroupBy(x => new { x.BankName, x.CurrencyCode })
            .Select(g => new BankBalanceItemResponse(g.Key.BankName, g.Key.CurrencyCode, g.Sum(x => x.SignedAmount)))
            .OrderBy(x => x.BankName)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        var now = DateTime.UtcNow;
        var currentMonthIndex = (now.Year * 12) + now.Month;
        var minMonthIndex = currentMonthIndex - 2;

        var incomeOutcomes = transactionRows
            .Where(x =>
            {
                var monthIndex = (x.TransactionDate.Year * 12) + x.TransactionDate.Month;
                return monthIndex >= minMonthIndex && monthIndex <= currentMonthIndex;
            })
            .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month, x.CurrencyCode })
            .Select(g => new IncomeOutcomeItemResponse(
                g.Key.Year,
                g.Key.Month,
                g.Key.CurrencyCode,
                g.Where(x => x.SignedAmount > 0).Sum(x => x.SignedAmount),
                g.Where(x => x.SignedAmount < 0).Sum(x => -x.SignedAmount)))
            .OrderByDescending(x => x.Year)
            .ThenByDescending(x => x.Month)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        return TypedResults.Ok(new TransactionDashboardResponse(currencyBalances, activeBankBalances, incomeOutcomes));
    }
}


