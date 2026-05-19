using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class DeleteTransferTransactionHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var transfer = await dbContext.Transfers
            .Include(x => x.TransferTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleOrDefaultAsync(
                x => x.Id == id && x.TransferTransactions.Any(y => y.Transaction.OwnerId == currentUserId),
                cancellationToken);

        if (transfer is null)
        {
            return AppHttpResults.NotFound("Transfer not found.", "No Transfer matched the specified identifier.");
        }

        transfer.IsActive = false;
        foreach (var item in transfer.TransferTransactions)
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
