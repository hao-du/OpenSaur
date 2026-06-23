namespace OpenSaur.CashPilot.Web.Features.PendingTransactions.Dtos;

public sealed record OfflineTransactionRecordDto(
    decimal Amount,
    byte? BankAccountStatus,
    byte? BankAccountTransactionType,
    string? BankName,
    string CurrencyCode,
    string Description,
    string Id,
    bool IsActive,
    string? UserId,
    string PayloadJson,
    string? CounterpartyName,
    byte? Direction,
    string? TransferId,
    byte? TransferStatus,
    byte? TransferType,
    string? ExchangeId,
    string[] Tags,
    string TransactionDate,
    string Type,
    string UpdatedAt);

public sealed record PendingTransactionRecordResponse(
    Guid Id,
    OfflineTransactionRecordDto Payload,
    DateTime CreatedOn,
    DateTime? UpdatedOn);

public sealed record PendingTransactionSyncRequest(Guid[] Ids);

public sealed record PendingTransactionSyncResponse(int Synced, int Failed);
