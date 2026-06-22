namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

internal interface ICashFlowFormRequest
{
    Guid CurrencyId { get; }
    decimal Amount { get; }
    byte Direction { get; }
}

public sealed record TransactionListItemResponse(
    Guid Id,
    Guid? BankAccountId,
    Guid? TransferId,
    Guid? ExchangeId,
    string? BankName,
    byte? BankAccountStatus,
    byte? BankAccountTransactionType,
    string? CounterpartyName,
    byte? TransferStatus,
    byte? TransferType,
    string Type,
    string? Description,
    string[] Tags,
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
    string? Description,
    string[] Tags,
    IReadOnlyList<TransactionItemRequest> TransactionItems) : ICashFlowFormRequest;
public sealed record UpdateCashFlowRequest(
    Guid Id,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<TransactionItemRequest> TransactionItems) : ICashFlowFormRequest;

public interface IBankAccountFormRequest
{
    Guid BankId { get; }
    Guid CurrencyId { get; }
    decimal Amount { get; }
    decimal? InterestRate { get; }
    DateOnly StartDate { get; }
    DateOnly? MaturityDate { get; }
    byte Status { get; }
    string? AccountNumber { get; }
    string? Description { get; }
    string[] Tags { get; }
    IReadOnlyList<SaveBankAccountDetailRequest> Details { get; }
    IReadOnlyList<TransactionItemRequest> TransactionItems { get; }
}

public sealed record CreateBankAccountFormRequest(
    Guid BankId,
    Guid CurrencyId,
    decimal Amount,
    decimal? InterestRate,
    DateOnly StartDate,
    DateOnly? MaturityDate,
    byte Status,
    string? AccountNumber,
    string? Description,
    string[] Tags,
    IReadOnlyList<SaveBankAccountDetailRequest> Details,
    IReadOnlyList<TransactionItemRequest> TransactionItems) : IBankAccountFormRequest;

public sealed record UpdateBankAccountFormRequest(
    Guid Id,
    Guid BankId,
    Guid CurrencyId,
    decimal Amount,
    decimal? InterestRate,
    DateOnly StartDate,
    DateOnly? MaturityDate,
    byte Status,
    string? AccountNumber,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<SaveBankAccountDetailRequest> Details,
    IReadOnlyList<TransactionItemRequest> TransactionItems) : IBankAccountFormRequest;

public sealed record SaveBankAccountFormRequest(
    Guid? Id,
    Guid BankId,
    Guid CurrencyId,
    decimal Amount,
    decimal? InterestRate,
    DateOnly StartDate,
    DateOnly? MaturityDate,
    byte Status,
    string? AccountNumber,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<SaveBankAccountDetailRequest> Details,
    IReadOnlyList<TransactionItemRequest> TransactionItems);

public sealed record SaveBankAccountDetailRequest(
    Guid? Id,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    byte TransactionType,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);
public interface ITransferFormRequest
{
    Guid CounterpartyId { get; }
    byte TransferType { get; }
    byte Status { get; }
    Guid CurrencyId { get; }
    decimal Amount { get; }
    DateOnly TransactionDate { get; }
    DateOnly? DueDate { get; }
    string? Description { get; }
    string[] Tags { get; }
    IReadOnlyList<SaveTransferDetailRequest> Details { get; }
    IReadOnlyList<TransactionItemRequest> TransactionItems { get; }
}

public sealed record CreateTransferFormRequest(
    Guid CounterpartyId,
    byte TransferType,
    byte Status,
    Guid CurrencyId,
    decimal Amount,
    DateOnly TransactionDate,
    DateOnly? DueDate,
    string? Description,
    string[] Tags,
    IReadOnlyList<SaveTransferDetailRequest> Details,
    IReadOnlyList<TransactionItemRequest> TransactionItems) : ITransferFormRequest;

public sealed record UpdateTransferFormRequest(
    Guid Id,
    Guid CounterpartyId,
    byte TransferType,
    byte Status,
    Guid CurrencyId,
    decimal Amount,
    DateOnly TransactionDate,
    DateOnly? DueDate,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<SaveTransferDetailRequest> Details,
    IReadOnlyList<TransactionItemRequest> TransactionItems) : ITransferFormRequest;

public sealed record SaveTransferFormRequest(
    Guid? Id,
    Guid CounterpartyId,
    byte TransferType,
    byte Status,
    Guid CurrencyId,
    decimal Amount,
    DateOnly TransactionDate,
    DateOnly? DueDate,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<SaveTransferDetailRequest> Details,
    IReadOnlyList<TransactionItemRequest> TransactionItems);

public sealed record SaveTransferDetailRequest(
    Guid? Id,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record CreateCurrencyExchangeRequest(
    decimal? ExchangeRate,
    DateOnly ExchangeDate,
    ExchangeLegRequest OutLeg,
    ExchangeLegRequest InLeg,
    string? Description,
    string[] Tags,
    IReadOnlyList<TransactionItemRequest> TransactionItems);
public sealed record UpdateCurrencyExchangeRequest(
    Guid Id,
    decimal? ExchangeRate,
    DateOnly ExchangeDate,
    ExchangeLegRequest OutLeg,
    ExchangeLegRequest InLeg,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<TransactionItemRequest> TransactionItems);

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
    bool IsActive,
    string[] Tags,
    IReadOnlyList<TransactionItemResponse> TransactionItems);

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

public sealed record TransferFormDetailResponse(
    Guid Id,
    Guid CurrencyId,
    decimal Amount,
    byte Direction,
    DateOnly TransactionDate,
    string? Description,
    bool IsActive);

public sealed record TransferFormResponse(
    Guid Id,
    Guid CounterpartyId,
    byte TransferType,
    byte Status,
    Guid CurrencyId,
    decimal Amount,
    DateOnly TransactionDate,
    DateOnly? DueDate,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<TransferFormDetailResponse> Details,
    IReadOnlyList<TransactionItemResponse> TransactionItems);

public sealed record CurrencyExchangeDetailResponse(
    Guid Id,
    decimal? ExchangeRate,
    DateOnly ExchangeDate,
    ExchangeLegResponse OutLeg,
    ExchangeLegResponse InLeg,
    string? Description,
    bool IsActive,
    string[] Tags,
    IReadOnlyList<TransactionItemResponse> TransactionItems);

public sealed record TransactionItemRequest(
    string Name,
    decimal Amount);

public sealed record TransactionItemResponse(
    Guid Id,
    string Name,
    decimal Amount);

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

public sealed record DailyInOutCalendarQueryRequest(int? Year, int? Month);

public sealed record DailyInOutCalendarItemResponse(int Day, decimal Income, decimal Outcome);

public sealed record DailyInOutCalendarResponse(
    int Year,
    int Month,
    string? CurrencyCode,
    IReadOnlyList<DailyInOutCalendarItemResponse> Items);
