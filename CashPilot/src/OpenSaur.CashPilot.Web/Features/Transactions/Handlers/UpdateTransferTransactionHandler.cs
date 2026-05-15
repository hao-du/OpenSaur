using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateTransferTransactionHandler
{
    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateTransferTransactionRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        if (request.Amount <= 0 || (request.Direction != 1 && request.Direction != 2))
        {
            return AppHttpResults.BadRequest("Invalid transfer transaction payload.", "Amount must be positive and direction must be 1 or 2.");
        }

        var entity = await dbContext.TransferTransactions
            .Include(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id && x.Transaction.OwnerId == currentUserId, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("TransferTransaction not found.", "No TransferTransaction matched the specified identifier.");
        }

        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.IsActive = request.IsActive;

        entity.Transaction.Amount = request.Amount;
        entity.Transaction.CurrencyId = request.CurrencyId;
        entity.Transaction.Direction = (TransactionDirection)request.Direction;
        entity.Transaction.TransactionDate = request.TransactionDate;
        entity.Transaction.Description = request.Description?.Trim() ?? string.Empty;

        await dbContext.SaveChangesAsync(cancellationToken);

        var transfer = await dbContext.Transfers
            .Include(x => x.TransferTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleAsync(x => x.Id == entity.TransferId, cancellationToken);

        if (transfer.TransferType is TransferType.Lend or TransferType.Borrow)
        {
            var settled = transfer.TransferType == TransferType.Lend
                ? transfer.TransferTransactions.Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.Direction == TransactionDirection.In).Sum(x => x.Transaction.Amount)
                : transfer.TransferTransactions.Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.Direction == TransactionDirection.Out).Sum(x => x.Transaction.Amount);

            transfer.Status = settled >= transfer.Amount ? TransferStatus.Completed : TransferStatus.Active;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return TypedResults.Ok(id);
    }
}
