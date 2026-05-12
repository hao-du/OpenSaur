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
public sealed record BankAccountLookupResponse(
    Guid Id,
    string BankShortName,
    string? AccountNumber,
    string CurrencyCode,
    string Status,
    decimal Amount);

public sealed record TransferLookupResponse(
    Guid Id,
    string CounterpartyName,
    string TransferType,
    string CurrencyCode,
    string Status,
    decimal Amount,
    decimal RemainingAmount);

public sealed record CreateCashFlowRequest(
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description);
public sealed record UpdateCashFlowRequest(
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record CreateBankAccountRequest(
    Guid BankId,
    Guid CurrencyId,
    decimal Amount,
    decimal InterestRate,
    DateOnly StartDate,
    DateOnly MaturityDate,
    string? AccountNumber,
    string? Description);
public sealed record SaveBankAccountFormRequest(
    Guid? Id,
    Guid BankId,
    Guid CurrencyId,
    decimal Amount,
    decimal InterestRate,
    DateOnly StartDate,
    DateOnly MaturityDate,
    byte Status,
    string? AccountNumber,
    string? Description,
    bool IsActive,
    IReadOnlyList<SaveBankAccountDetailRequest> Details);

public sealed record SaveBankAccountDetailRequest(
    Guid? Id,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    byte TransactionType,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);
public sealed record UpdateBankAccountRequest(
    Guid BankId,
    Guid CurrencyId,
    decimal Amount,
    decimal InterestRate,
    DateOnly StartDate,
    DateOnly MaturityDate,
    byte Status,
    string? AccountNumber,
    string? Description,
    bool IsActive);

public sealed record AddBankAccountTransactionRequest(
    Guid CurrencyId,
    Guid BankAccountId,
    decimal Amount,
    byte Direction,
    byte TransactionType,
    DateOnly TransactionDate,
    string? Description);
public sealed record UpdateBankAccountTransactionRequest(
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    byte TransactionType,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record CreateTransferRequest(
    Guid CounterpartyId,
    byte TransferType,
    Guid CurrencyId,
    decimal Amount,
    DateOnly TransactionDate,
    DateOnly? DueDate,
    string? Description);
public sealed record UpdateTransferRequest(
    Guid CounterpartyId,
    byte TransferType,
    Guid CurrencyId,
    decimal Amount,
    DateOnly TransactionDate,
    DateOnly? DueDate,
    byte Status,
    string? Description,
    bool IsActive);

public sealed record AddTransferTransactionRequest(
    Guid TransferId,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description);
public sealed record UpdateTransferTransactionRequest(
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record CreateCurrencyExchangeRequest(
    decimal ExchangeRate,
    DateOnly ExchangeDate,
    ExchangeLegRequest OutLeg,
    ExchangeLegRequest InLeg,
    string? Description);
public sealed record UpdateCurrencyExchangeRequest(
    decimal ExchangeRate,
    DateOnly ExchangeDate,
    ExchangeLegRequest OutLeg,
    ExchangeLegRequest InLeg,
    string? Description,
    bool IsActive);

public sealed record ExchangeLegRequest(
    Guid CurrencyId,
    decimal Amount,
    string? Description);
public sealed record CashFlowDetailResponse(
    Guid Id,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record BankAccountTransactionDetailResponse(
    Guid Id,
    Guid BankAccountId,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    byte TransactionType,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record TransferTransactionDetailResponse(
    Guid Id,
    Guid TransferId,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record CurrencyExchangeDetailResponse(
    Guid Id,
    decimal ExchangeRate,
    DateOnly ExchangeDate,
    ExchangeLegResponse OutLeg,
    ExchangeLegResponse InLeg,
    string? Description,
    bool IsActive);

public sealed record ExchangeLegResponse(
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
