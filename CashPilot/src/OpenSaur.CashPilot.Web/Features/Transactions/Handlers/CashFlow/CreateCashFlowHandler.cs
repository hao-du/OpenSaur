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

public static class CreateCashFlowHandler
{
    private static readonly CreateCashFlowRequestValidator Validator = new();

    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>, ValidationProblem>> HandleAsync(
        CreateCashFlowRequest request,
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

        var currencyValidation = await TransactionEntityValidationHelper.EnsureCurrencyExistsAsync(
            dbContext,
            currentUserId,
            request.CurrencyId,
            cancellationToken);
        if (currencyValidation is not null)
        {
            return currencyValidation;
        }

        var transaction = new Transaction
        {
            Amount = request.Amount,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            Direction = (TransactionDirection)request.Direction,
            OwnerId = currentUserId,
            TransactionDate = request.TransactionDate
        };

        var cashFlow = new CashFlow
        {
            Description = request.Description?.Trim() ?? string.Empty,
            Transaction = transaction,
            TransactionItems = request.TransactionItems.ToTransactionItems()
        };
        cashFlow.Tags = TagTermCodec.Encode(request.Tags ?? []);
        await tagService.EnsureTagDefinitionsExistAsync(currentUserId, request.Tags ?? [], cancellationToken);

        dbContext.CashFlows.Add(cashFlow);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/cashflows/{cashFlow.Id}", cashFlow.Id);
    }
}



