using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.OidcClients.DeleteOidcClient;

public static class DeleteOidcClientHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ApplicationDbContext dbContext,
        IOpenIddictApplicationManager applicationManager,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .SingleOrDefaultAsync(client => client.Id == id, cancellationToken);
        if (application is null)
        {
            return AppHttpResults.NotFound("OIDC client not found.", "No managed OIDC client matched the provided identifier.");
        }

        await applicationManager.DeleteAsync(application, cancellationToken);

        return TypedResults.NoContent();
    }
}
