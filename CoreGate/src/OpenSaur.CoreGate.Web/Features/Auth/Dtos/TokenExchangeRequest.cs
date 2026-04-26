namespace OpenSaur.CoreGate.Web.Features.Auth.Dtos;

public sealed record TokenExchangeRequest(
    string ClientId,
    string Code,
    string CodeVerifier,
    string RedirectUri,
    string ImpersonatedUserId);
