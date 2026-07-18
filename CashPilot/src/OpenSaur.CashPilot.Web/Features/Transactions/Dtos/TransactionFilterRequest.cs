namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

public sealed record TransactionFilterRequest(
    string Description,
    string FromDate,
    string ToDate,
    bool ShowOnlyInitialDeposits,
    string[] Types);