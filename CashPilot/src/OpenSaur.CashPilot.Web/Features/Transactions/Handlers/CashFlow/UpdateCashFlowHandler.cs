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

public static class UpdateCashFlowHandler
{
    private static readonly UpdateCashFlowRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem, NotFound<ProblemDetails>>> HandleAsync(
        UpdateCashFlowRequest request,
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

        var entity = await dbContext.CashFlows
            .Include(x => x.Transaction)
            .Include(x => x.TransactionItems)
            .SingleOrDefaultAsync(x => x.Id == request.Id && x.Transaction.OwnerId == currentUserId, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound(
                TransactionValidationMessages.CashFlowNotFoundTitle,
                TransactionValidationMessages.CashFlowNotFoundDetail);
        }

        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.IsActive = request.IsActive;
        entity.Transaction.Amount = request.Amount;
        entity.Transaction.CurrencyId = request.CurrencyId;
        entity.Transaction.Direction = (TransactionDirection)request.Direction;
        entity.Transaction.TransactionDate = request.TransactionDate;
        entity.Transaction.Description = request.Description?.Trim() ?? string.Empty;
        entity.Tags = TagTermCodec.Encode(request.Tags ?? []);
        await tagService.EnsureTagDefinitionsExistAsync(currentUserId, request.Tags ?? [], cancellationToken);

        dbContext.TransactionItems.RemoveRange(entity.TransactionItems);
        entity.TransactionItems = request.TransactionItems.ToTransactionItems();

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(request.Id);
    }
}




