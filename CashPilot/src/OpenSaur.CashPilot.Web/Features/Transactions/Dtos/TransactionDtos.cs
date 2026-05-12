namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

public sealed record TransactionListItemResponse(
    Guid Id,
    string Type,
    string? Description,
    string CurrencyCode,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    bool IsActive);

public sealed record CreateCashFlowRequest(
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description);

public sealed record CreateBankAccountRequest(
    Guid BankId,
    Guid CurrencyId,
    decimal Amount,
    decimal InterestRate,
    DateOnly StartDate,
    DateOnly MaturityDate,
    string? AccountNumber,
    string? Description);

public sealed record AddBankAccountTransactionRequest(
    Guid CurrencyId,
    Guid BankAccountId,
    decimal Amount,
    byte Direction,
    byte TransactionType,
    DateOnly TransactionDate,
    string? Description);

public sealed record CreateTransferRequest(
    Guid CounterpartyId,
    byte TransferType,
    Guid CurrencyId,
    decimal Amount,
    DateOnly TransactionDate,
    DateOnly? DueDate,
    string? Description);

public sealed record AddTransferTransactionRequest(
    Guid TransferId,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description);

public sealed record CreateCurrencyExchangeRequest(
    decimal ExchangeRate,
    DateOnly ExchangeDate,
    ExchangeLegRequest OutLeg,
    ExchangeLegRequest InLeg,
    string? Description);

public sealed record ExchangeLegRequest(
    Guid CurrencyId,
    decimal Amount,
    string? Description);

public sealed record CurrencyBalanceItemResponse(string CurrencyCode, decimal Total);

public sealed record BankBalanceItemResponse(string BankName, string CurrencyCode, decimal TotalDeposited);

public sealed record IncomeOutcomeItemResponse(int Year, int Month, string CurrencyCode, decimal Income, decimal Outcome);

public sealed record TransactionDashboardResponse(
    IReadOnlyList<CurrencyBalanceItemResponse> CurrencyBalances,
    IReadOnlyList<BankBalanceItemResponse> ActiveBankBalances,
    IReadOnlyList<IncomeOutcomeItemResponse> IncomeOutcomes);
