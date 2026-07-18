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

public static class CreateCurrencyExchangeHandler
{
    private static readonly CreateCurrencyExchangeRequestValidator Validator = new();

    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>, ValidationProblem>> HandleAsync(
        CreateCurrencyExchangeRequest request,
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

        var currenciesValidation = await TransactionEntityValidationHelper.EnsureCurrenciesExistAsync(
            dbContext,
            currentUserId,
            new[] { request.OutLeg.CurrencyId, request.InLeg.CurrencyId },
            cancellationToken);
        if (currenciesValidation is not null)
        {
            return currenciesValidation;
        }

        var exchange = new CurrencyExchange
        {
            Description = request.Description?.Trim() ?? string.Empty,
            ExchangeDate = request.ExchangeDate,
            ExchangeRate = request.ExchangeRate,
            TransactionItems = request.TransactionItems.ToTransactionItems()
        };
        exchange.Tags = TagTermCodec.Encode(request.Tags ?? []);
        await tagService.EnsureTagDefinitionsExistAsync(currentUserId, request.Tags ?? [], cancellationToken);

        var outTransaction = new Transaction
        {
            Amount = request.OutLeg.Amount,
            CurrencyId = request.OutLeg.CurrencyId,
            Description = request.OutLeg.Description?.Trim() ?? string.Empty,
            Direction = TransactionDirection.Out,
            OwnerId = currentUserId,
            TransactionDate = request.ExchangeDate
        };

        var inTransaction = new Transaction
        {
            Amount = request.InLeg.Amount,
            CurrencyId = request.InLeg.CurrencyId,
            Description = request.InLeg.Description?.Trim() ?? string.Empty,
            Direction = TransactionDirection.In,
            OwnerId = currentUserId,
            TransactionDate = request.ExchangeDate
        };

        exchange.CurrencyExchangeTransactions.Add(new CurrencyExchangeTransaction
        {
            Description = request.Description?.Trim() ?? string.Empty,
            Transaction = outTransaction
        });

        exchange.CurrencyExchangeTransactions.Add(new CurrencyExchangeTransaction
        {
            Description = request.Description?.Trim() ?? string.Empty,
            Transaction = inTransaction
        });

        dbContext.CurrencyExchanges.Add(exchange);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/exchanges/{exchange.Id}", exchange.Id);
    }
}



