namespace OpenSaur.Identity.Web.Features.OidcClients.GetOidcClientById;

public sealed record GetOidcClientByIdResponse(
    Guid Id,
    string AppPathBase,
    string CallbackPath,
    string ClientId,
    string Description,
    string DisplayName,
    bool IsActive,
    string[] Origins,
    string PostLogoutPath,
    string Scope);
