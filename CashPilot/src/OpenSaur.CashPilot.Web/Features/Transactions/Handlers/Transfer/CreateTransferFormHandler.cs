using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateTransferFormHandler
{
    private static readonly CreateTransferFormRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem>> HandleAsync(
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

        var transfer = new Transfer
        {
            Amount = request.Amount,
            CounterpartyId = request.CounterpartyId,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            DueDate = request.DueDate,
            TransactionDate = request.TransactionDate,
            TransferType = (TransferType)request.TransferType,
            IsActive = request.IsActive
        };
        dbContext.Transfers.Add(transfer);

        foreach (var detail in request.Details)
        {
            var movement = new TransferTransaction
            {
                Transfer = transfer,
                Description = detail.Description?.Trim() ?? string.Empty,
                IsActive = detail.IsActive,
                Transaction = new Transaction
                {
                    OwnerId = currentUserId,
                    Amount = detail.Amount,
                    CurrencyId = detail.CurrencyId,
                    Direction = (TransactionDirection)detail.Direction,
                    TransactionDate = detail.TransactionDate,
                    Description = detail.Description?.Trim() ?? string.Empty,
                    IsActive = detail.IsActive
                }
            };
            dbContext.TransferTransactions.Add(movement);
        }

        if (transfer.TransferType is TransferType.Lend or TransferType.Borrow)
        {
            var settled = transfer.TransferType == TransferType.Lend
                ? transfer.TransferTransactions.Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.Direction == TransactionDirection.In).Sum(x => x.Transaction.Amount)
                : transfer.TransferTransactions.Where(x => x.IsActive && x.Transaction.IsActive && x.Transaction.Direction == TransactionDirection.Out).Sum(x => x.Transaction.Amount);

            transfer.Status = settled >= transfer.Amount ? TransferStatus.Completed : TransferStatus.Active;
        }
        else
        {
            transfer.Status = TransferStatus.Active;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(transfer.Id);
    }
}
