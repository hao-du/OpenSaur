using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Helpers;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Validation;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateBankAccountFormHandler
{
    private static readonly CreateBankAccountFormRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem, NotFound<ProblemDetails>>> HandleAsync(
        CreateBankAccountFormRequest request,
        ClaimsPrincipal user,
        BankAccountMovementManager bankAccountMovementManager,
        ITagService tagService,
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

        var bankValidation = await TransactionEntityValidationHelper.EnsureBankExistsAsync(
            dbContext,
            currentUserId,
            request.BankId,
            cancellationToken);
        if (bankValidation is not null)
        {
            return bankValidation;
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

        var bankAccount = new BankAccount();
        dbContext.BankAccounts.Add(bankAccount);

        bankAccount.AccountNumber = request.AccountNumber?.Trim();
        bankAccount.Amount = request.Amount;
        bankAccount.BankId = request.BankId;
        bankAccount.CurrencyId = request.CurrencyId;
        bankAccount.Description = request.Description?.Trim() ?? string.Empty;
        bankAccount.InterestRate = request.InterestRate;
        bankAccount.MaturityDate = request.MaturityDate;
        bankAccount.StartDate = request.StartDate;
        bankAccount.Status = (BankAccountStatus)request.Status;
        bankAccount.IsActive = true;
        bankAccount.TransactionItems = request.TransactionItems.ToTransactionItems();
        bankAccount.Tags = TagTermCodec.Encode(request.Tags ?? []);
        await tagService.EnsureTagDefinitionsExistAsync(currentUserId, request.Tags ?? [], cancellationToken);

        var saveRequest = new SaveBankAccountFormRequest(
            null,
            request.BankId,
            request.CurrencyId,
            request.Amount,
            request.InterestRate,
            request.StartDate,
            request.MaturityDate,
            request.Status,
            request.AccountNumber,
            request.Description,
            IsActive: true,
            request.Tags ?? [],
            request.Details,
            request.TransactionItems);

        var syncResult = bankAccountMovementManager.SyncMovements(bankAccount, saveRequest, currentUserId, dbContext);
        if (!syncResult.Success)
        {
            return AppHttpResults.NotFound(
                TransactionValidationMessages.BankAccountTransactionNotFoundTitle,
                TransactionValidationMessages.BankAccountTransactionNotFoundDetail);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(bankAccount.Id);
    }
}



