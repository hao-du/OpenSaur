using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.OidcClients.GetOidcClients;

public static class GetOidcClientsHandler
{
    public static async Task<Ok<OidcClientSummaryResponse[]>> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var clients = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .AsNoTracking()
            .OrderBy(client => client.DisplayName)
            .ThenBy(client => client.ClientId)
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(
            clients.Select(ToSummaryResponse)
                .ToArray());
    }

    private static OidcClientSummaryResponse ToSummaryResponse(OpenIddictEntityFrameworkCoreApplication<Guid> application)
    {
        return new OidcClientSummaryResponse(
            application.Id,
            application.ClientId ?? string.Empty,
            string.IsNullOrWhiteSpace(application.DisplayName) ? application.ClientId ?? string.Empty : application.DisplayName,
            application.ClientType ?? OpenIddictConstants.ClientTypes.Public,
            StringHelper.ParseStringArray(application.RedirectUris),
            StringHelper.ParseStringArray(application.PostLogoutRedirectUris),
            OidcClientHelper.GetScope(application.Permissions));
    }
}
