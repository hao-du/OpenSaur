using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;

namespace OpenSaur.Identity.Web.Features.OidcClients.GetOidcClients;

public static class GetOidcClientsHandler
{
    public static async Task<IResult> HandleAsync(
        ManagedOidcClientResolver managedOidcClientResolver,
        CancellationToken cancellationToken)
    {
        var clients = await managedOidcClientResolver.GetClientsAsync(activeOnly: false, cancellationToken);

        return ApiResponses.Success(
            clients.Select(
                    client => new OidcClientSummaryResponse(
                        client.Id,
                        client.ClientId,
                        client.DisplayName,
                        client.Description,
                        client.Scope,
                        client.AppPathBase,
                        client.IsActive,
                        client.Origins.ToArray(),
                        client.RedirectUris.ToArray(),
                        client.PostLogoutRedirectUris.ToArray()))
                .ToArray());
    }
}
