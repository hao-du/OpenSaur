namespace OpenSaur.CashPilot.Web.Features.Reports.Dtos;

public sealed record GetIncomeOutcomeQueryRequest(int Year, string? TagName);

public sealed record IncomeOutcomeResponseItem(
    int Month,
    string CurrencyCode,
    DateOnly StartDate,
    DateOnly? EndDate,
    decimal Income,
    decimal Outcome);

public sealed record IncomeOutcomeResponse(
    int Year,
    string? DefaultCurrencyCode,
    IReadOnlyList<IncomeOutcomeResponseItem> Items);

public sealed record GetIncomeOutcomeByRangeQueryRequest(DateOnly FromDate, DateOnly ToDate);

public sealed record DateRangeIncomeOutcomeResponseItem(
    int Year,
    int Month,
    string CurrencyCode,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal Income,
    decimal Outcome);

public sealed record DateRangeIncomeOutcomeResponse(
    DateOnly FromDate,
    DateOnly ToDate,
    string? DefaultCurrencyCode,
    IReadOnlyList<DateRangeIncomeOutcomeResponseItem> Items);
