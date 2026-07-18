namespace OpenSaur.CashPilot.Web.Features.Tags.Dtos;

public sealed record TagDefinitionResponse(
    Guid Id,
    string Name,
    string[] MatchingTerms,
    bool IsActive,
    bool Marker,
    bool IsDefaultMaker);

public sealed record SaveTagDefinitionRequest(
    string Name,
    string[] MatchingTerms,
    bool Marker = false,
    bool IsDefaultMaker = false);
