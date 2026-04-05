using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.OidcClients.DeleteOidcClient;

public static class DeleteOidcClientHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        HttpContext httpContext,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        ManagedOidcClientResolver managedOidcClientResolver,
        ManagedOidcClientSynchronizer managedOidcClientSynchronizer,
        CancellationToken cancellationToken)
    {
        var oidcClient = await dbContext.OidcClients
            .Include(client => client.Origins)
            .SingleOrDefaultAsync(client => client.Id == id, cancellationToken);
        if (oidcClient is null)
        {
            return Result.NotFound(
                    "OIDC client not found.",
                    "No managed OIDC client matched the provided identifier.")
                .ToApiErrorResult();
        }

        var currentClient = await managedOidcClientResolver.ResolveCurrentClientAsync(httpContext.Request, cancellationToken);
        if (currentClient?.Id == id)
        {
            return Result.Conflict(
                    "Current OIDC client cannot be deleted.",
                    "The active admin shell client cannot be deleted from its own host.")
                .ToApiErrorResult();
        }

        oidcClient.IsActive = false;
        oidcClient.UpdatedBy = currentUserContext.UserId;

        foreach (var origin in oidcClient.Origins)
        {
            origin.IsActive = false;
            origin.UpdatedBy = currentUserContext.UserId;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await managedOidcClientSynchronizer.SynchronizeClientAsync(id, cancellationToken);

        return ApiResponses.NoContent();
    }
}
