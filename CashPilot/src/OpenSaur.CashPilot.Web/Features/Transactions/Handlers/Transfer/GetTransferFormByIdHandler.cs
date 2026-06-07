using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Features.Tags;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransferFormByIdHandler
{
    public static async Task<Results<Ok<TransferFormResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var entity = await dbContext.Transfers
            .AsNoTracking()
            .Include(x => x.TransferTransactions)
                .ThenInclude(x => x.Transaction)
            .Include(x => x.TransactionItems)
            .SingleOrDefaultAsync(
                x => x.Id == id && x.TransferTransactions.Any(y => y.Transaction.OwnerId == currentUserId),
                cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("Transfer not found.", "No Transfer matched the specified identifier.");
        }

        var details = entity.TransferTransactions
            .Where(x => x.Transaction.IsActive)
            .OrderByDescending(x => x.Transaction.TransactionDate)
            .Select(x => new TransferFormDetailResponse(
                x.Id,
                x.Transaction.CurrencyId,
                x.Transaction.Amount,
                (byte)x.Transaction.Direction,
                x.Transaction.TransactionDate,
                x.Description,
                x.IsActive))
            .ToList();

        return TypedResults.Ok(new TransferFormResponse(
            entity.Id,
            entity.CounterpartyId,
            (byte)entity.TransferType,
            (byte)entity.Status,
            entity.CurrencyId,
            entity.Amount,
            entity.TransactionDate,
            entity.DueDate,
            entity.Description,
            entity.IsActive,
            TagTermCodec.Decode(entity.Tags),
            details,
            entity.TransactionItems.Select(x => new TransactionItemResponse(x.Id, x.Name, x.Amount)).ToList()));
    }
}
