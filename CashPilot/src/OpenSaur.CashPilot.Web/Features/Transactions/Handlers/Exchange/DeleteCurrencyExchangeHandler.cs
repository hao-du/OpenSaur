using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Validation;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class DeleteCurrencyExchangeHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var entity = await dbContext.CurrencyExchanges
            .Include(x => x.CurrencyExchangeTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleOrDefaultAsync(
                x => x.Id == id && x.IsActive && x.CurrencyExchangeTransactions.Any(y => y.Transaction.OwnerId == currentUserId),
                cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound(
                TransactionValidationMessages.CurrencyExchangeNotFoundTitle,
                TransactionValidationMessages.CurrencyExchangeNotFoundDetail);
        }

        entity.IsActive = false;
        foreach (var exchangeTransaction in entity.CurrencyExchangeTransactions)
        {
            exchangeTransaction.IsActive = false;
            exchangeTransaction.Transaction.IsActive = false;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.NoContent();
    }
}




