namespace OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;

public sealed record CounterpartyResponse(
    Guid Id,
    string FullName,
    string? Email,
    string? PhoneNumber,
    string? Description,
    bool IsActive);

public sealed record CreateCounterpartyRequest(
    string FullName,
    string? Email,
    string? PhoneNumber,
    string? Description);

public sealed record UpdateCounterpartyRequest(
    string FullName,
    string? Email,
    string? PhoneNumber,
    string? Description,
    bool IsActive);
