namespace OpenSaur.CashPilot.Web.Features.Currencies.Dtos;

public sealed record CurrencyResponse(
    Guid Id,
    string Name,
    string ShortName,
    string? Description,
    bool IsDefault);

public sealed record CreateCurrencyRequest(
    string Name,
    string ShortName,
    string? Description,
    bool IsDefault);

public sealed record UpdateCurrencyRequest(
    string Name,
    string ShortName,
    string? Description,
    bool IsDefault);
