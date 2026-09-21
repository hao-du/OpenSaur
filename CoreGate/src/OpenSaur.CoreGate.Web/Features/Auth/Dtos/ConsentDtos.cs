namespace OpenSaur.CoreGate.Web.Features.Auth.Dtos;

public sealed record GetConsentDetailsRequest(
    string ReturnUrl);

public sealed record ConsentScopeItem(
    string Name,
    string Description);

public sealed record ConsentDetailsResponse(
    string ClientDisplayName,
    IReadOnlyList<ConsentScopeItem> Scopes,
    string ReturnUrl);

public sealed record ConsentDecisionRequest(
    string Decision,
    string ReturnUrl);

public sealed record ConsentDecisionResponse(
    string RedirectUrl);
