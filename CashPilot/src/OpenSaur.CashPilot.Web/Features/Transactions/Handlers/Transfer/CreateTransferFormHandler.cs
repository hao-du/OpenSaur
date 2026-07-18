using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Helpers;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Validation;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateTransferFormHandler
{
    private static readonly CreateTransferFormRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem>> HandleAsync(
        CreateTransferFormRequest request,
        ClaimsPrincipal user,
        TagService tagService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest(
                TransactionValidationMessages.UserRequiredTitle,
                TransactionValidationMessages.UserRequiredDetail);
        }

        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var counterpartyValidation = await TransactionEntityValidationHelper.EnsureCounterpartyExistsAsync(
            dbContext,
            currentUserId,
            request.CounterpartyId,
            cancellationToken);
        if (counterpartyValidation is not null)
        {
            return counterpartyValidation;
        }

        var currencyIds = request.Details.Select(x => x.CurrencyId).Append(request.CurrencyId).Distinct().ToList();
        var currenciesValidation = await TransactionEntityValidationHelper.EnsureCurrenciesExistAsync(
            dbContext,
            currentUserId,
            currencyIds,
            cancellationToken);
        if (currenciesValidation is not null)
        {
            return currenciesValidation;
        }

        var transfer = new Transfer
        {
            Amount = TransferAmountCalculator.CalculateAmount(request.Details),
            CounterpartyId = request.CounterpartyId,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            DueDate = request.DueDate,
            TransactionDate = request.TransactionDate,
            TransferType = (TransferType)request.TransferType,
            Status = (TransferStatus)request.Status,
            IsActive = true,
            TransactionItems = request.TransactionItems.ToTransactionItems()
        };
        transfer.Tags = TagTermCodec.Encode(request.Tags ?? []);
        await tagService.EnsureTagDefinitionsExistAsync(currentUserId, request.Tags ?? [], cancellationToken);
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



