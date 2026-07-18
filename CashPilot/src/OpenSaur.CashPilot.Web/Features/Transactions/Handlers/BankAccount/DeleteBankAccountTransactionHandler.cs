using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Validation;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class DeleteBankAccountTransactionHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var bankAccount = await dbContext.BankAccounts
            .Include(x => x.BankAccountTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleOrDefaultAsync(
                x => x.Id == id && x.BankAccountTransactions.Any(y => y.Transaction.OwnerId == currentUserId),
                cancellationToken);

        if (bankAccount is null)
        {
            return AppHttpResults.NotFound(
                TransactionValidationMessages.BankAccountNotFoundTitle,
                TransactionValidationMessages.BankAccountNotFoundDetail);
        }

        bankAccount.IsActive = false;
        foreach (var item in bankAccount.BankAccountTransactions)
        {
            if (item.Transaction.OwnerId != currentUserId)
            {
                continue;
            }

            item.IsActive = false;
            item.Transaction.IsActive = false;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.NoContent();
    }
}




