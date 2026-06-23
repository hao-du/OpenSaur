using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.PendingTransactions.Handlers;

public static class DeletePendingTransactionHandler
{
    public static async Task<Results<NoContent, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest(
                "User required",
                "A valid user is required to delete pending transactions.");
        }

        var entity = await dbContext.PendingTransactionSubmissions
            .SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == currentUserId, cancellationToken);
        if (entity is null)
        {
            return AppHttpResults.NotFound("Pending transaction not found", "The pending transaction could not be found.");
        }

        dbContext.PendingTransactionSubmissions.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
