using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.OidcClients.GetOidcClientById;

public static class GetOidcClientByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .AsNoTracking()
            .SingleOrDefaultAsync(client => client.Id == id, cancellationToken);
        if (application is null)
        {
            return Result.NotFound(
                    "OIDC client not found.",
                    "No managed OIDC client matched the provided identifier.")
                .ToApiErrorResult();
        }

        var metadata = OpenIddictApplicationMetadataMapper.Read(application);

        return ApiResponses.Success(
            new GetOidcClientByIdResponse(
                application.Id,
                metadata.AppPathBase,
                metadata.CallbackPath,
                application.ClientId ?? string.Empty,
                metadata.Description,
                string.IsNullOrWhiteSpace(application.DisplayName) ? application.ClientId ?? string.Empty : application.DisplayName,
                metadata.IsActive,
                metadata.Origins,
                metadata.PostLogoutPath,
                metadata.Scope));
    }
}
