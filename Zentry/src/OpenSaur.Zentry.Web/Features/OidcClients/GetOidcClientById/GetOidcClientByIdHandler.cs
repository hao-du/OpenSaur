using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore.Models;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenIddict.Abstractions;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.OidcClients.GetOidcClientById;

public static class GetOidcClientByIdHandler
{
    public static async Task<Results<Ok<GetOidcClientByIdResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .AsNoTracking()
            .SingleOrDefaultAsync(client => client.Id == id, cancellationToken);
        if (application is null)
        {
            return AppHttpResults.NotFound("OIDC client not found.", "No managed OIDC client matched the provided identifier.");
        }

        var response = new GetOidcClientByIdResponse(
            application.Id,
            application.ClientId ?? string.Empty,
            string.IsNullOrWhiteSpace(application.DisplayName) ? application.ClientId ?? string.Empty : application.DisplayName,
            application.ClientType ?? OpenIddictConstants.ClientTypes.Public,
            StringHelper.ParseStringArray(application.RedirectUris),
            StringHelper.ParseStringArray(application.PostLogoutRedirectUris),
            OidcClientHelper.GetScope(application.Permissions));

        return TypedResults.Ok(response);
    }
}
