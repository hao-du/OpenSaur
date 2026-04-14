using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;

namespace OpenSaur.Identity.Web.Features.OidcClients.GetOidcClients;

public static class GetOidcClientsHandler
{
    public static async Task<IResult> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var clients = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .AsNoTracking()
            .OrderBy(client => client.DisplayName)
            .ThenBy(client => client.ClientId)
            .ToListAsync(cancellationToken);

        return ApiResponses.Success(
            clients.Select(
                    client =>
                    {
                        var metadata = OpenIddictApplicationMetadataMapper.Read(client);
                        return new OidcClientSummaryResponse(
                            client.Id,
                            metadata.AppPathBase,
                            metadata.CallbackPath,
                            client.ClientId ?? string.Empty,
                            metadata.Description,
                            string.IsNullOrWhiteSpace(client.DisplayName) ? client.ClientId ?? string.Empty : client.DisplayName,
                            metadata.IsActive,
                            metadata.Origins,
                            metadata.PostLogoutPath,
                            metadata.RedirectUris,
                            metadata.PostLogoutRedirectUris,
                            metadata.Scope);
                    })
                .ToArray());
    }
}
