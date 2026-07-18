namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

public sealed record IncomeOutcomeLatestPeriodItemResponse(
    DateOnly? StartDate,
    DateOnly? EndDate,
    int? Year,
    int? Month,
    decimal Income,
    decimal Outcome);

public sealed record IncomeOutcomeLatestPeriodsResponse(
    bool IsMonthly,
    IReadOnlyList<IncomeOutcomeLatestPeriodItemResponse> Items);
