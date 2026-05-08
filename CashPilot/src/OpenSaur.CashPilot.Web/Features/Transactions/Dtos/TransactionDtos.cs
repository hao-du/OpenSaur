namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

public sealed record TransactionResponse(
    Guid Id,
    decimal Amount,
    Guid CurrencyId,
    string CurrencyName,
    string? Description,
    bool IsIncome,
    DateTime TransactedOn,
    string Type);

public sealed record UpsertCashFlowRequest(
    decimal Amount,
    Guid CurrencyId,
    string? Description,
    bool IsIncome,
    DateTime TransactedOn);
