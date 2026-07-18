namespace OpenSaur.CashPilot.Web.Features.Banks.Dtos;

public sealed record BankResponse(
    Guid Id,
    string Name,
    string ShortName,
    string? Description,
    bool IsDefault);

public sealed record CreateBankRequest(
    string Name,
    string ShortName,
    string? Description,
    bool IsDefault);

public sealed record UpdateBankRequest(
    string Name,
    string ShortName,
    string? Description,
    bool IsDefault);

public sealed record BankBalanceResponse(
    string BankName,
    string CurrencyCode,
    decimal TotalDeposited);
