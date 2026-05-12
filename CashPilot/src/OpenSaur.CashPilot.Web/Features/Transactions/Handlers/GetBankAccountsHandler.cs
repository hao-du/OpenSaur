using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetBankAccountsHandler
{
    public static async Task<Ok<IReadOnlyList<BankAccountLookupResponse>>> HandleAsync(
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.BankAccounts
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new BankAccountLookupResponse(
                x.Id,
                x.Bank.ShortName,
                x.AccountNumber,
                x.Currency.ShortName,
                x.Status.ToString(),
                x.Amount))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<BankAccountLookupResponse>>(result);
    }
}
