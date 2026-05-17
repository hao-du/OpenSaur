using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateTransferFormHandler
{
    private static readonly UpdateTransferFormRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem, NotFound<ProblemDetails>>> HandleAsync(
        SaveTransferFormRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest("User is required.", "Transactions require an authenticated user identifier.");
        }

        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var existingTransfer = await dbContext.Transfers
            .Include(x => x.TransferTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleOrDefaultAsync(
                x => x.Id == request.Id.Value && x.TransferTransactions.All(y => y.Transaction.OwnerId == currentUserId),
                cancellationToken);
        if (existingTransfer is null)
        {
            return AppHttpResults.NotFound("Transfer not found.", "No Transfer matched the specified identifier.");
        }

        var transfer = existingTransfer;
        transfer.Amount = request.Amount;
        transfer.CounterpartyId = request.CounterpartyId;
        transfer.CurrencyId = request.CurrencyId;
        transfer.Description = request.Description?.Trim() ?? string.Empty;
        transfer.DueDate = request.DueDate;
        transfer.TransactionDate = request.TransactionDate;
        transfer.TransferType = (TransferType)request.TransferType;
        transfer.Status = (TransferStatus)request.Status;
        transfer.IsActive = request.IsActive;

        var requestedIds = request.Details.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();
        var removedRows = transfer.TransferTransactions.Where(x => !requestedIds.Contains(x.Id)).ToList();
        if (removedRows.Count > 0)
        {
            dbContext.TransferTransactions.RemoveRange(removedRows);
            dbContext.Transactions.RemoveRange(removedRows.Select(x => x.Transaction));
        }

        foreach (var detail in request.Details)
        {
            TransferTransaction movement;
            if (detail.Id is null)
            {
                movement = new TransferTransaction
                {
                    Transfer = transfer,
                    Transaction = new Transaction
                    {
                        OwnerId = currentUserId
                    }
                };
                dbContext.TransferTransactions.Add(movement);
            }
            else
            {
                var existingMovement = transfer.TransferTransactions.SingleOrDefault(x => x.Id == detail.Id.Value);
                if (existingMovement is null)
                {
                    return AppHttpResults.NotFound("TransferTransaction not found.", "A detail row did not match the specified identifier.");
                }
                movement = existingMovement;
            }

            movement.Description = detail.Description?.Trim() ?? string.Empty;
            movement.IsActive = detail.IsActive;

            movement.Transaction.Amount = detail.Amount;
            movement.Transaction.CurrencyId = detail.CurrencyId;
            movement.Transaction.Direction = (TransactionDirection)detail.Direction;
            movement.Transaction.TransactionDate = detail.TransactionDate;
            movement.Transaction.Description = detail.Description?.Trim() ?? string.Empty;
            movement.Transaction.IsActive = detail.IsActive;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(transfer.Id);
    }
}
