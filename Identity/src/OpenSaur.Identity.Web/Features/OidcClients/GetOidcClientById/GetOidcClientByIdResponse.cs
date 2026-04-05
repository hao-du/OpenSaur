namespace OpenSaur.Identity.Web.Features.OidcClients.GetOidcClientById;

public sealed record GetOidcClientByIdResponse(
    Guid Id,
    string ClientId,
    string DisplayName,
    string Description,
    string Scope,
    string AppPathBase,
    bool IsActive,
    string[] Origins);
