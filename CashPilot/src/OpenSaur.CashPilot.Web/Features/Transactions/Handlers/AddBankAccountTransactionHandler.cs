using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class AddBankAccountTransactionHandler
{
    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>>> HandleAsync(
        AddBankAccountTransactionRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || (request.Direction != 1 && request.Direction != 2) || request.TransactionType is < 1 or > 3)
        {
            return AppHttpResults.BadRequest("Invalid bank account transaction payload.", "Amount must be positive and enum values must be valid.");
        }

        var transaction = new Transaction
        {
            Amount = request.Amount,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            Direction = (TransactionDirection)request.Direction,
            TransactionDate = request.TransactionDate
        };

        var movement = new BankAccountTransaction
        {
            BankAccountId = request.BankAccountId,
            Description = request.Description?.Trim() ?? string.Empty,
            Transaction = transaction,
            TransactionType = (BankAccountMovementType)request.TransactionType
        };

        dbContext.BankAccountTransactions.Add(movement);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/bankaccounts/{request.BankAccountId}/transactions/{movement.Id}", movement.Id);
    }
}
