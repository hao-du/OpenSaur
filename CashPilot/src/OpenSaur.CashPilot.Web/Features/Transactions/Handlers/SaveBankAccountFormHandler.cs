using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class SaveBankAccountFormHandler
{
    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        SaveBankAccountFormRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || request.InterestRate < 0 || request.MaturityDate < request.StartDate || request.Status is < 1 or > 3)
        {
            return AppHttpResults.BadRequest("Invalid bank account payload.", "Invalid amount, interest rate, date range, or status.");
        }

        if (request.Details.Any(x => x.Amount <= 0 || (x.Direction != 1 && x.Direction != 2) || x.TransactionType is < 1 or > 3))
        {
            return AppHttpResults.BadRequest("Invalid bank account detail payload.", "Invalid detail row values.");
        }

        BankAccount bankAccount;

        if (request.Id is null)
        {
            bankAccount = new BankAccount();
            dbContext.BankAccounts.Add(bankAccount);
        }
        else
        {
            bankAccount = await dbContext.BankAccounts
                .Include(x => x.BankAccountTransactions)
                    .ThenInclude(x => x.Transaction)
                .SingleOrDefaultAsync(x => x.Id == request.Id.Value, cancellationToken);
            if (bankAccount is null)
            {
                return AppHttpResults.NotFound("BankAccount not found.", "No BankAccount matched the specified identifier.");
            }
        }

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

        if (request.Id is not null)
        {
            var requestedIds = request.Details.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();
            var removedRows = bankAccount.BankAccountTransactions.Where(x => !requestedIds.Contains(x.Id)).ToList();

            if (removedRows.Count > 0)
            {
                dbContext.BankAccountTransactions.RemoveRange(removedRows);
                dbContext.Transactions.RemoveRange(removedRows.Select(x => x.Transaction));
            }
        }

        foreach (var detail in request.Details)
        {
            BankAccountTransaction movement;
            if (detail.Id is null)
            {
                movement = new BankAccountTransaction
                {
                    BankAccount = bankAccount,
                    Transaction = new Transaction()
                };
                dbContext.BankAccountTransactions.Add(movement);
            }
            else
            {
                movement = bankAccount.BankAccountTransactions.SingleOrDefault(x => x.Id == detail.Id.Value);
                if (movement is null)
                {
                    return AppHttpResults.NotFound("BankAccountTransaction not found.", "A detail row did not match the specified identifier.");
                }
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
