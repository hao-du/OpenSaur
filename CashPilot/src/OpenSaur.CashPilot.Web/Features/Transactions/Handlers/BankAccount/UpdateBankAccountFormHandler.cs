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
using OpenSaur.CashPilot.Web.Features.Transactions.Services;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateBankAccountFormHandler
{
    private static readonly UpdateBankAccountFormRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem, NotFound<ProblemDetails>>> HandleAsync(
        UpdateBankAccountFormRequest request,
        ClaimsPrincipal user,
        BankAccountMovementService bankAccountMovementManager,
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

        var id = request.Id;
        var existingBankAccount = await dbContext.BankAccounts
            .Include(x => x.BankAccountTransactions)
                .ThenInclude(x => x.Transaction)
            .Include(x => x.TransactionItems)
            .Where(x => !x.BankAccountTransactions.Any() || x.BankAccountTransactions.All(y => y.Transaction.OwnerId == currentUserId))
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (existingBankAccount is null)
        {
            return AppHttpResults.NotFound(
                TransactionValidationMessages.BankAccountNotFoundTitle,
                TransactionValidationMessages.BankAccountNotFoundDetail);
        }

        var bankAccount = existingBankAccount;
        bankAccount.AccountNumber = request.AccountNumber?.Trim();
        bankAccount.Amount = request.Amount;
        bankAccount.BankId = request.BankId;
        bankAccount.CurrencyId = request.CurrencyId;
        bankAccount.Description = request.Description?.Trim() ?? string.Empty;
        bankAccount.InterestRate = request.InterestRate;
        bankAccount.MaturityDate = request.MaturityDate;
        bankAccount.StartDate = request.StartDate;
        bankAccount.Status = (BankAccountStatus)request.Status;
        bankAccount.IsActive = request.IsActive;
        dbContext.TransactionItems.RemoveRange(bankAccount.TransactionItems);
        bankAccount.TransactionItems = request.TransactionItems.ToTransactionItems();
        bankAccount.Tags = TagTermCodec.Encode(request.Tags ?? []);
        await tagService.EnsureTagDefinitionsExistAsync(currentUserId, request.Tags ?? [], cancellationToken);

        var saveRequest = new SaveBankAccountFormRequest(
            request.Id,
            request.BankId,
            request.CurrencyId,
            request.Amount,
            request.InterestRate,
            request.StartDate,
            request.MaturityDate,
            request.Status,
            request.AccountNumber,
            request.Description,
            request.IsActive,
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




