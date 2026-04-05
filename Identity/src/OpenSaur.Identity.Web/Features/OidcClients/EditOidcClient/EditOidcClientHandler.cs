using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.OidcClients.EditOidcClient;

public static class EditOidcClientHandler
{
    public static async Task<IResult> HandleAsync(
        EditOidcClientRequest request,
        IValidator<EditOidcClientRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        ManagedOidcClientSynchronizer managedOidcClientSynchronizer,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var oidcClient = await dbContext.OidcClients
            .Include(client => client.Origins)
            .SingleOrDefaultAsync(client => client.Id == request.Id, cancellationToken);
        if (oidcClient is null)
        {
            return Result.NotFound(
                    "OIDC client not found.",
                    "No managed OIDC client matched the provided identifier.")
                .ToApiErrorResult();
        }

        var normalizedClientId = request.ClientId.Trim();
        var normalizedAppPathBase = OidcClientRequestNormalization.NormalizeAppPathBase(request.AppPathBase);
        var normalizedOrigins = OidcClientRequestNormalization.NormalizeOrigins(request.Origins);
        if (normalizedOrigins.Length == 0)
        {
            return Result.Validation(
                    ResultErrors.Validation(
                        "At least one origin is required.",
                        "Managed OIDC clients must define at least one public origin."))
                .ToApiErrorResult();
        }

        if (await OidcClientRequestNormalization.EnsureClientIdAvailableAsync(
                dbContext,
                normalizedClientId,
                request.Id,
                cancellationToken) is { } clientIdConflict)
        {
            return clientIdConflict.ToApiErrorResult();
        }

        if (request.IsActive
            && await OidcClientRequestNormalization.EnsureOriginsAvailableAsync(
                dbContext,
                normalizedAppPathBase,
                normalizedOrigins,
                request.Id,
                cancellationToken) is { } originConflict)
        {
            return originConflict.ToApiErrorResult();
        }

        oidcClient.AppPathBase = normalizedAppPathBase;
        oidcClient.ClientId = normalizedClientId;
        if (!string.IsNullOrWhiteSpace(request.ClientSecret))
        {
            oidcClient.ClientSecret = request.ClientSecret.Trim();
        }

        oidcClient.Description = request.Description.Trim();
        oidcClient.DisplayName = request.DisplayName.Trim();
        oidcClient.IsActive = request.IsActive;
        oidcClient.Scope = request.Scope.Trim();
        oidcClient.UpdatedBy = currentUserContext.UserId;

        dbContext.OidcClientOrigins.RemoveRange(oidcClient.Origins);
        oidcClient.Origins = OidcClientRequestNormalization.CreateOrigins(normalizedOrigins, currentUserContext.UserId);

        await dbContext.SaveChangesAsync(cancellationToken);
        await managedOidcClientSynchronizer.SynchronizeClientAsync(oidcClient.Id, cancellationToken);

        return ApiResponses.NoContent();
    }
}
