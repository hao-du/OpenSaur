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

public static class UpdateBankAccountFormHandler
{
    private static readonly UpdateBankAccountFormRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem, NotFound<ProblemDetails>>> HandleAsync(
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

        var existingBankAccount = await dbContext.BankAccounts
            .Include(x => x.BankAccountTransactions)
                .ThenInclude(x => x.Transaction)
            .Where(x => !x.BankAccountTransactions.Any() || x.BankAccountTransactions.All(y => y.Transaction.OwnerId == currentUserId))
            .SingleOrDefaultAsync(x => x.Id == request.Id.Value, cancellationToken);
        if (existingBankAccount is null)
        {
            return AppHttpResults.NotFound("BankAccount not found.", "No BankAccount matched the specified identifier.");
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

        var requestedIds = request.Details.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();
        var removedRows = bankAccount.BankAccountTransactions.Where(x => !requestedIds.Contains(x.Id)).ToList();
        if (removedRows.Count > 0)
        {
            dbContext.BankAccountTransactions.RemoveRange(removedRows);
            dbContext.Transactions.RemoveRange(removedRows.Select(x => x.Transaction));
        }

        foreach (var detail in request.Details)
        {
            BankAccountTransaction movement;
            if (detail.Id is null)
            {
                movement = new BankAccountTransaction
                {
                    BankAccount = bankAccount,
                    Transaction = new Transaction
                    {
                        OwnerId = currentUserId
                    }
                };
                dbContext.BankAccountTransactions.Add(movement);
            }
            else
            {
                var existingMovement = bankAccount.BankAccountTransactions.SingleOrDefault(x => x.Id == detail.Id.Value);
                if (existingMovement is null)
                {
                    return AppHttpResults.NotFound("BankAccountTransaction not found.", "A detail row did not match the specified identifier.");
                }
                movement = existingMovement;
            }

            movement.Description = detail.Description?.Trim() ?? string.Empty;
            movement.IsActive = detail.IsActive;
            movement.TransactionType = (BankAccountMovementType)detail.TransactionType;

            movement.Transaction.Amount = detail.Amount;
            movement.Transaction.CurrencyId = detail.CurrencyId;
            movement.Transaction.Direction = (TransactionDirection)detail.Direction;
            movement.Transaction.TransactionDate = detail.TransactionDate;
            movement.Transaction.Description = detail.Description?.Trim() ?? string.Empty;
            movement.Transaction.IsActive = detail.IsActive;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(bankAccount.Id);
    }
}
