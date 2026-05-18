using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
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
        
        var hasCounterparty = await dbContext.Counterparties
            .AnyAsync(x => x.Id == request.CounterpartyId && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        if (!hasCounterparty)
        {
            return AppHttpResults.BadRequest("Counterparty is invalid.", "The selected counterparty does not exist for the current user.");
        }

        var currencyIds = request.Details.Select(x => x.CurrencyId).Append(request.CurrencyId).Distinct().ToList();
        var currencyCount = await dbContext.Currencies
            .CountAsync(x => currencyIds.Contains(x.Id) && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        if (currencyCount != currencyIds.Count)
        {
            return AppHttpResults.BadRequest("Currency is invalid.", "One or more selected currencies do not exist for the current user.");
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
            Status = (TransferStatus)request.Status,
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

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(transfer.Id);
    }
}
