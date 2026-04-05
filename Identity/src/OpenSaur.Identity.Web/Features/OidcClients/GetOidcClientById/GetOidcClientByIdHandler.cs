using Microsoft.EntityFrameworkCore;
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
        var oidcClient = await dbContext.OidcClients
            .AsNoTracking()
            .Include(client => client.Origins)
            .SingleOrDefaultAsync(client => client.Id == id, cancellationToken);
        if (oidcClient is null)
        {
            return Result.NotFound(
                    "OIDC client not found.",
                    "No managed OIDC client matched the provided identifier.")
                .ToApiErrorResult();
        }

        var normalizedOrigins = oidcClient.Origins
            .Where(origin => origin.IsActive)
            .Select(origin => origin.BaseUri)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(origin => origin, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return ApiResponses.Success(
            new GetOidcClientByIdResponse(
                oidcClient.Id,
                oidcClient.ClientId,
                oidcClient.DisplayName,
                oidcClient.Description,
                oidcClient.Scope,
                oidcClient.AppPathBase,
                oidcClient.IsActive,
                normalizedOrigins));
    }
}
