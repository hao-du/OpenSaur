using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.PendingTransactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.PendingTransactions.Handlers;

public static class UpdatePendingTransactionHandler
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<Results<Ok, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        OfflineTransactionRecordDto transaction,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest(
                "User required",
                "A valid user is required to update pending transactions.");
        }

        var entity = await dbContext.PendingTransactionSubmissions
            .SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == currentUserId, cancellationToken);
        if (entity is null)
        {
            return AppHttpResults.NotFound("Pending transaction not found", "The pending transaction could not be found.");
        }

        entity.LocalTransactionId = transaction.Id;
        entity.PayloadJson = JsonSerializer.Serialize(transaction, JsonOptions);
        entity.UpdatedBy = currentUserId;
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok();
    }
}
