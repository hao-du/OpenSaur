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

public static class GetPendingTransactionsHandler
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<Results<Ok<IReadOnlyList<PendingTransactionRecordResponse>>, BadRequest<ProblemDetails>>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest(
                "User required",
                "A valid user is required to read pending transactions.");
        }

        var pendingRows = await dbContext.PendingTransactionSubmissions
            .AsNoTracking()
            .Where(x => x.OwnerId == currentUserId)
            .OrderByDescending(x => x.CreatedOn)
            .ToListAsync(cancellationToken);

        var items = pendingRows
            .Select(x => new PendingTransactionRecordResponse(
                x.Id,
                JsonSerializer.Deserialize<OfflineTransactionRecordDto>(x.PayloadJson, JsonOptions)!,
                x.CreatedOn,
                x.UpdatedOn))
            .ToList();

        return TypedResults.Ok<IReadOnlyList<PendingTransactionRecordResponse>>(items);
    }
}
