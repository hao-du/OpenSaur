using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.PendingTransactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using System.Text.Json;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.PendingTransactions.Handlers;

public static class SubmitPendingTransactionsHandler
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<Results<Ok, BadRequest<ProblemDetails>>> HandleAsync(
        IReadOnlyList<OfflineTransactionRecordDto> transactions,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest(
                "User required",
                "A valid user is required to submit pending transactions.");
        }

        foreach (var transaction in transactions)
        {
            var entity = await dbContext.PendingTransactionSubmissions
                .SingleOrDefaultAsync(x => x.OwnerId == currentUserId && x.LocalTransactionId == transaction.Id, cancellationToken);

            if (entity is null)
            {
                entity = new PendingTransactionSubmission
                {
                    CreatedBy = currentUserId,
                    OwnerId = currentUserId,
                    LocalTransactionId = transaction.Id
                };
                dbContext.PendingTransactionSubmissions.Add(entity);
            }

            entity.PayloadJson = JsonSerializer.Serialize(transaction, JsonOptions);
            entity.UpdatedBy = currentUserId;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok();
    }
}
