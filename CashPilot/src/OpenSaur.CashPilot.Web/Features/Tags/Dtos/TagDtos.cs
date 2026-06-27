namespace OpenSaur.CashPilot.Web.Features.Tags.Dtos;

public sealed record TagDefinitionResponse(
    Guid Id,
    string Name,
    string[] MatchingTerms,
    bool IsActive,
    bool Marker);

public sealed record SaveTagDefinitionRequest(
    string Name,
    string[] MatchingTerms,
    bool IsActive,
    bool Marker = false);
