namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

public sealed record TransactionPeriodQueryRequest(DateOnly? StartDate, DateOnly? EndDate);

public sealed record IncomeOutcomeLatestPeriodsQueryRequest(bool IsMonthly);
