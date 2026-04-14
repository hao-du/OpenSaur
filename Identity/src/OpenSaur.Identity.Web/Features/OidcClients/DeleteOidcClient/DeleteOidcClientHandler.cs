using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Features.OidcClients.CreateOidcClient;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.OidcClients.DeleteOidcClient;

public static class DeleteOidcClientHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        ApplicationDbContext dbContext,
        IOpenIddictApplicationManager applicationManager,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .SingleOrDefaultAsync(client => client.Id == id, cancellationToken);
        if (application is null)
        {
            return Result.NotFound(
                    "OIDC client not found.",
                    "No managed OIDC client matched the provided identifier.")
                .ToApiErrorResult();
        }

        var metadata = OpenIddictApplicationMetadataMapper.Read(application) with
        {
            IsActive = false
        };
        var descriptor = new OpenIddictApplicationDescriptor();
        await applicationManager.PopulateAsync(descriptor, application, cancellationToken);
        CreateOidcClientHandler.ApplyApplicationConfiguration(descriptor, metadata);
        await applicationManager.UpdateAsync(application, descriptor, cancellationToken);

        return ApiResponses.NoContent();
    }
}
