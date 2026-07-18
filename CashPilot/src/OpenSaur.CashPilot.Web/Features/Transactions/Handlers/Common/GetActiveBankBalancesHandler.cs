using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetActiveBankBalancesHandler
{
    public static async Task<Ok<IReadOnlyList<BankBalanceResponse>>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var activeBankRows = await dbContext.BankAccounts
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.Status == BankAccountStatus.Active &&
                x.BankAccountTransactions.Any(bat =>
                    bat.IsActive &&
                    bat.Transaction.IsActive &&
                    bat.Transaction.OwnerId == currentUserId))
            .Select(x => new
            {
                BankName = x.Bank.Name,
                CurrencyCode = x.Currency.ShortName,
                SignedAmount = x.Amount
            })
            .ToListAsync(cancellationToken);

        var activeBankBalances = activeBankRows
            .GroupBy(x => new { x.BankName, x.CurrencyCode })
            .Select(g => new BankBalanceResponse(g.Key.BankName, g.Key.CurrencyCode, g.Sum(x => x.SignedAmount)))
            .OrderBy(x => x.BankName)
            .ThenBy(x => x.CurrencyCode)
            .ToList();

        return TypedResults.Ok<IReadOnlyList<BankBalanceResponse>>(activeBankBalances);
    }
}
