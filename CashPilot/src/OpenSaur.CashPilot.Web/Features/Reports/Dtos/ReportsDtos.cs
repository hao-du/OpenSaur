namespace OpenSaur.CashPilot.Web.Features.Reports.Dtos;

public sealed record GetIncomeOutcomeQueryRequest(int Year, string? TagName);

public sealed record IncomeOutcomeResponseItem(
    int Month,
    string CurrencyCode,
    string Label,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal Income,
    decimal Outcome);

public sealed record IncomeOutcomeResponse(
    int Year,
    string? DefaultCurrencyCode,
    IReadOnlyList<IncomeOutcomeResponseItem> Items);
