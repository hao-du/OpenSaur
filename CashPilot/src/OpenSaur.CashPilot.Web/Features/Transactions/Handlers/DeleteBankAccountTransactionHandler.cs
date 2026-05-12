using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class DeleteBankAccountTransactionHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.BankAccountTransactions
            .Include(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return AppHttpResults.NotFound("BankAccountTransaction not found.", "No BankAccountTransaction matched the specified identifier.");
        }

        dbContext.BankAccountTransactions.Remove(entity);
        dbContext.Transactions.Remove(entity.Transaction);
        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.NoContent();
    }
}
