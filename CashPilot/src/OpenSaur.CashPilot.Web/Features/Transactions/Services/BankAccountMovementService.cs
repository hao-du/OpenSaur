using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Services;

public sealed record BankAccountMovementSyncResult(
    bool Success,
    bool MissingDetail);

public sealed class BankAccountMovementService
{
    public BankAccountMovementSyncResult SyncMovements(
        BankAccount bankAccount,
        SaveBankAccountFormRequest request,
        Guid currentUserId,
        CashPilotDbContext dbContext)
    {
        var requestInterestDetails = request.Details
            .Where(x => x.TransactionType == (byte)BankAccountMovementType.InterestPayment)
            .ToList();

        var interestRows = bankAccount.BankAccountTransactions
            .Where(x => x.TransactionType == BankAccountMovementType.InterestPayment)
            .ToList();

        var requestedIds = requestInterestDetails.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();
        var removedRows = interestRows.Where(x => !requestedIds.Contains(x.Id)).ToList();
        if (removedRows.Count > 0)
        {
            dbContext.BankAccountTransactions.RemoveRange(removedRows);
            dbContext.Transactions.RemoveRange(removedRows.Select(x => x.Transaction));
        }

        foreach (var detail in requestInterestDetails)
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
                    return new BankAccountMovementSyncResult(false, true);
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

        var initialDeposit = bankAccount.BankAccountTransactions.SingleOrDefault(x => x.TransactionType == BankAccountMovementType.InitialDeposit);
        if (initialDeposit is null)
        {
            initialDeposit = new BankAccountTransaction
            {
                BankAccount = bankAccount,
                TransactionType = BankAccountMovementType.InitialDeposit,
                Transaction = new Transaction
                {
                    OwnerId = currentUserId
                }
            };
            dbContext.BankAccountTransactions.Add(initialDeposit);
        }

        initialDeposit.Description = request.Description?.Trim() ?? string.Empty;
        initialDeposit.IsActive = request.IsActive;
        initialDeposit.Transaction.Amount = request.Amount;
        initialDeposit.Transaction.CurrencyId = request.CurrencyId;
        initialDeposit.Transaction.Direction = TransactionDirection.Out;
        initialDeposit.Transaction.TransactionDate = request.StartDate;
        initialDeposit.Transaction.Description = request.Description?.Trim() ?? string.Empty;
        initialDeposit.Transaction.IsActive = request.IsActive;

        var principalReturn = bankAccount.BankAccountTransactions.SingleOrDefault(x => x.TransactionType == BankAccountMovementType.PrincipalReturn);
        var shouldHavePrincipalReturn = request.Status is (byte)BankAccountStatus.Matured or (byte)BankAccountStatus.ClosedEarly;

        if (shouldHavePrincipalReturn)
        {
            if (principalReturn is null)
            {
                principalReturn = new BankAccountTransaction
                {
                    BankAccount = bankAccount,
                    TransactionType = BankAccountMovementType.PrincipalReturn,
                    Transaction = new Transaction
                    {
                        OwnerId = currentUserId
                    }
                };
                dbContext.BankAccountTransactions.Add(principalReturn);
            }

            principalReturn.Description = request.Description?.Trim() ?? string.Empty;
            principalReturn.IsActive = request.IsActive;
            principalReturn.Transaction.Amount = request.Amount;
            principalReturn.Transaction.CurrencyId = request.CurrencyId;
            principalReturn.Transaction.Direction = TransactionDirection.In;
            principalReturn.Transaction.TransactionDate = request.MaturityDate ?? request.StartDate;
            principalReturn.Transaction.Description = request.Description?.Trim() ?? string.Empty;
            principalReturn.Transaction.IsActive = request.IsActive;
        }
        else if (principalReturn is not null)
        {
            dbContext.BankAccountTransactions.Remove(principalReturn);
            dbContext.Transactions.Remove(principalReturn.Transaction);
        }

        return new BankAccountMovementSyncResult(true, false);
    }
}
