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
                        client.AppPathBase,
                        client.CallbackPath,
                        client.ClientId,
                        client.Description,
                        client.DisplayName,
                        client.IsActive,
                        client.Origins.ToArray(),
                        client.PostLogoutPath,
                        client.RedirectUris.ToArray(),
                        client.PostLogoutRedirectUris.ToArray(),
                        client.Scope))
                .ToArray());
    }
}
