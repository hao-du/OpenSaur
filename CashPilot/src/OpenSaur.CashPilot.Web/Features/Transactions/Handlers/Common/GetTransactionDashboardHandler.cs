using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionDashboardHandler
{
    public static async Task<Ok<TransactionDashboardResponse>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var cashFlowRows = await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                Code = x.Transaction.Currency.ShortName,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var bankMovementRows = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Where(x => x.TransactionType != BankAccountMovementType.InitialDeposit && x.TransactionType != BankAccountMovementType.PrincipalReturn)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                Code = x.Transaction.Currency.ShortName,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var transferRows = await dbContext.TransferTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transfer.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                Code = x.Transaction.Currency.ShortName,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var exchangeRows = await dbContext.CurrencyExchangeTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.CurrencyExchange.IsActive && x.Transaction.IsActive && x.Transaction.OwnerId == currentUserId)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                Code = x.Transaction.Currency.ShortName,
                SignedAmount = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : -x.Transaction.Amount
            })
            .ToListAsync(cancellationToken);

        var transactionRows = cashFlowRows
            .Concat(bankMovementRows)
            .Concat(transferRows)
            .Concat(exchangeRows)
            .ToList();

        var currencyBalances = transactionRows
            .GroupBy(x => x.Code)
            .Select(g => new CurrencyBalanceItemResponse(g.Key, g.Sum(x => x.SignedAmount)))
            .OrderBy(x => x.CurrencyCode)
            .ToList();

        var activeBankRows = await dbContext.BankAccounts
            .AsNoTracking()
            .Where(x => x.IsActive
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

        var incomeOutcomes = transactionRows
            .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month, x.Code })
            .Select(g => new IncomeOutcomeItemResponse(
                g.Key.Year,
                g.Key.Month,
                g.Key.Code,
                g.Where(x => x.SignedAmount > 0).Sum(x => x.SignedAmount),
                g.Where(x => x.SignedAmount < 0).Sum(x => -x.SignedAmount)))
            .OrderByDescending(x => x.Year)
            .ThenByDescending(x => x.Month)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        return TypedResults.Ok(new TransactionDashboardResponse(currencyBalances, activeBankBalances, incomeOutcomes));
    }
}
