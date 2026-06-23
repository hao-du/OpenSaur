using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.PendingTransactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Handlers;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using System.Text.Json;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.PendingTransactions.Handlers;

public static class SyncPendingTransactionsHandler
{
    public static async Task<Results<Ok<PendingTransactionSyncResponse>, BadRequest<ProblemDetails>>> HandleAsync(
        PendingTransactionSyncRequest request,
        ClaimsPrincipal user,
        ITagService tagService,
        BankAccountMovementManager bankAccountMovementManager,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest(
                "User required",
                "A valid user is required to sync pending transactions.");
        }

        var pendingRows = await dbContext.PendingTransactionSubmissions
            .Where(x => x.OwnerId == currentUserId && request.Ids.Contains(x.Id))
            .OrderBy(x => x.CreatedOn)
            .ToListAsync(cancellationToken);

        var syncUser = PendingTransactionSyncHelper.CreateUserPrincipal(currentUserId);
        var synced = 0;
        var failed = 0;

        foreach (var pendingRow in pendingRows)
        {
            try
            {
                if (!await SyncPendingRowAsync(pendingRow, syncUser, tagService, bankAccountMovementManager, dbContext, cancellationToken))
                {
                    failed += 1;
                    continue;
                }

                dbContext.PendingTransactionSubmissions.Remove(pendingRow);
                synced += 1;
            }
            catch
            {
                failed += 1;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(new PendingTransactionSyncResponse(synced, failed));
    }

    private static async Task<bool> SyncPendingRowAsync(
        PendingTransactionSubmission pendingRow,
        ClaimsPrincipal user,
        ITagService tagService,
        BankAccountMovementManager bankAccountMovementManager,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var record = JsonSerializer.Deserialize<OfflineTransactionRecordDto>(pendingRow.PayloadJson, JsonOptions);
        if (record is null)
        {
            return false;
        }

        return record.Type switch
        {
            "CashFlow" => await CreateCashFlow(record, user, tagService, dbContext, cancellationToken),
            "BankAccount" => await CreateBankAccount(record, user, bankAccountMovementManager, tagService, dbContext, cancellationToken),
            "Transfer" => await CreateTransfer(record, user, tagService, dbContext, cancellationToken),
            "Exchange" => await CreateExchange(record, user, tagService, dbContext, cancellationToken),
            _ => false
        };
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static async Task<bool> CreateCashFlow(
        OfflineTransactionRecordDto record,
        ClaimsPrincipal user,
        ITagService tagService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<CreateCashFlowRequest>(record.PayloadJson, JsonOptions);
        if (request is null)
        {
            return false;
        }

        var result = await CreateCashFlowHandler.HandleAsync(request, user, tagService, dbContext, cancellationToken);
        return IsSuccess(result);
    }

    private static async Task<bool> CreateBankAccount(
        OfflineTransactionRecordDto record,
        ClaimsPrincipal user,
        BankAccountMovementManager bankAccountMovementManager,
        ITagService tagService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<CreateBankAccountFormRequest>(record.PayloadJson, JsonOptions);
        if (request is null)
        {
            return false;
        }

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

        var result = await CreateBankAccountFormHandler.HandleAsync(request, user, bankAccountMovementManager, tagService, dbContext, cancellationToken);
        return IsSuccess(result);
    }

    private static async Task<bool> CreateTransfer(
        OfflineTransactionRecordDto record,
        ClaimsPrincipal user,
        ITagService tagService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<CreateTransferFormRequest>(record.PayloadJson, JsonOptions);
        if (request is null)
        {
            return false;
        }

        var result = await CreateTransferFormHandler.HandleAsync(request, user, tagService, dbContext, cancellationToken);
        return IsSuccess(result);
    }

    private static async Task<bool> CreateExchange(
        OfflineTransactionRecordDto record,
        ClaimsPrincipal user,
        ITagService tagService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<CreateCurrencyExchangeRequest>(record.PayloadJson, JsonOptions);
        if (request is null)
        {
            return false;
        }

        var result = await CreateCurrencyExchangeHandler.HandleAsync(request, user, tagService, dbContext, cancellationToken);
        return IsSuccess(result);
    }

    private static bool IsSuccess(IResult result)
    {
        // Check for known failure types first
        if (result is BadRequest<ProblemDetails>) return false;
        if (result is ValidationProblem) return false;
        if (result is NotFound<ProblemDetails>) return false;
        if (result is IStatusCodeHttpResult statusCodeResult && statusCodeResult.StatusCode >= 400) return false;

        // All other cases (2xx, NoContent, Ok<T>) are considered success
        return true;
    }
}
