namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

public sealed record TransactionFilterParams(
    string? Description,
    DateOnly? FromDate,
    DateOnly? ToDate,
    bool ShowOnlyInitialDeposits,
    string[] Types);
