using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateBankAccountHandler
{
    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>>> HandleAsync(
        CreateBankAccountRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || request.InterestRate < 0 || request.MaturityDate < request.StartDate)
        {
            return AppHttpResults.BadRequest("Invalid bank account payload.", "Invalid amount, interest rate, or date range.");
        }

        var bankAccount = new BankAccount
        {
            AccountNumber = request.AccountNumber?.Trim(),
            Amount = request.Amount,
            BankId = request.BankId,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            InterestRate = request.InterestRate,
            MaturityDate = request.MaturityDate,
            StartDate = request.StartDate,
            Status = BankAccountStatus.Active
        };

        dbContext.BankAccounts.Add(bankAccount);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/bankaccounts/{bankAccount.Id}", bankAccount.Id);
    }
}
