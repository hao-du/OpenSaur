using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionDashboardHandler
{
    public static async Task<Ok<TransactionDashboardResponse>> HandleAsync(
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currencyRows = await dbContext.Transactions
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Where(x => !x.BankAccountTransactions.Any(bat => 
                bat.TransactionType == BankAccountMovementType.InitialDeposit || 
                bat.TransactionType == BankAccountMovementType.PrincipalReturn))
            .Select(x => new
            {
                Code = x.Currency.ShortName,
                SignedAmount = x.Direction == TransactionDirection.In ? x.Amount : -x.Amount
            })
            .ToListAsync(cancellationToken);

        var currencyBalances = currencyRows
            .GroupBy(x => x.Code)
            .Select(g => new CurrencyBalanceItemResponse(g.Key, g.Sum(x => x.SignedAmount)))
            .OrderBy(x => x.CurrencyCode)
            .ToList();

        var activeBankRows = await dbContext.BankAccounts
            .AsNoTracking()
            .Where(x => x.IsActive && x.Status == BankAccountStatus.Active)
            .Select(x => new
            {
                BankName = x.Bank.Name,
                CurrencyCode = x.Currency.ShortName,
                x.Amount
            })
            .ToListAsync(cancellationToken);

        var activeBankBalances = activeBankRows
            .GroupBy(x => new { x.BankName, x.CurrencyCode })
            .Select(g => new BankBalanceItemResponse(g.Key.BankName, g.Key.CurrencyCode, g.Sum(x => x.Amount)))
            .OrderBy(x => x.BankName)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        var cashFlowRows = await dbContext.CashFlows
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                CurrencyCode = x.Transaction.Currency.ShortName,
                Income = x.Transaction.Direction == TransactionDirection.In ? x.Transaction.Amount : 0m,
                Outcome = x.Transaction.Direction == TransactionDirection.Out ? x.Transaction.Amount : 0m
            })
            .ToListAsync(cancellationToken);

        var interestRows = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && x.TransactionType == BankAccountMovementType.InterestPayment)
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                CurrencyCode = x.Transaction.Currency.ShortName,
                Income = x.Transaction.Amount,
                Outcome = 0m
            })
            .ToListAsync(cancellationToken);

        var transferRows = await dbContext.TransferTransactions
            .AsNoTracking()
            .Where(x => x.IsActive && x.Transaction.IsActive && (x.Transfer.TransferType == TransferType.Give || x.Transfer.TransferType == TransferType.Receive))
            .Select(x => new
            {
                x.Transaction.TransactionDate,
                CurrencyCode = x.Transaction.Currency.ShortName,
                Income = x.Transfer.TransferType == TransferType.Receive ? x.Transaction.Amount : 0m,
                Outcome = x.Transfer.TransferType == TransferType.Give ? x.Transaction.Amount : 0m
            })
            .ToListAsync(cancellationToken);

        var incomeOutcomes = cashFlowRows
            .Concat(interestRows)
            .Concat(transferRows)
            .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month, x.CurrencyCode })
            .Select(g => new IncomeOutcomeItemResponse(g.Key.Year, g.Key.Month, g.Key.CurrencyCode, g.Sum(x => x.Income), g.Sum(x => x.Outcome)))
            .OrderByDescending(x => x.Year)
            .ThenByDescending(x => x.Month)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        return TypedResults.Ok(new TransactionDashboardResponse(currencyBalances, activeBankBalances, incomeOutcomes));
    }
}
