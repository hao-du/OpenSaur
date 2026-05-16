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

public static class CreateBankAccountFormHandler
{
    private static readonly CreateBankAccountFormRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem>> HandleAsync(
        SaveBankAccountFormRequest request,
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
        bankAccount.IsActive = request.IsActive;

        foreach (var detail in request.Details)
        {
            var movement = new BankAccountTransaction
            {
                BankAccount = bankAccount,
                Description = detail.Description?.Trim() ?? string.Empty,
                IsActive = detail.IsActive,
                TransactionType = (BankAccountMovementType)detail.TransactionType,
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
            dbContext.BankAccountTransactions.Add(movement);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(bankAccount.Id);
    }
}
