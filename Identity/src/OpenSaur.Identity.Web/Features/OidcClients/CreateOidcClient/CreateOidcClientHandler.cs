using FluentValidation;
using OpenSaur.Identity.Web.Domain.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.OidcClients.CreateOidcClient;

public static class CreateOidcClientHandler
{
    public static async Task<IResult> HandleAsync(
        CreateOidcClientRequest request,
        IValidator<CreateOidcClientRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        ManagedOidcClientSynchronizer managedOidcClientSynchronizer,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
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
                excludingOidcClientId: null,
                cancellationToken) is { } clientIdConflict)
        {
            return clientIdConflict.ToApiErrorResult();
        }

        if (await OidcClientRequestNormalization.EnsureOriginsAvailableAsync(
                dbContext,
                normalizedAppPathBase,
                normalizedOrigins,
                excludingOidcClientId: null,
                cancellationToken) is { } originConflict)
        {
            return originConflict.ToApiErrorResult();
        }

        var oidcClient = new OidcClient
        {
            AppPathBase = normalizedAppPathBase,
            ClientId = normalizedClientId,
            ClientSecret = request.ClientSecret.Trim(),
            CreatedBy = currentUserContext.UserId,
            Description = request.Description.Trim(),
            DisplayName = request.DisplayName.Trim(),
            IsActive = true,
            Scope = request.Scope.Trim(),
            Origins = OidcClientRequestNormalization.CreateOrigins(normalizedOrigins, currentUserContext.UserId)
        };

        dbContext.OidcClients.Add(oidcClient);
        await dbContext.SaveChangesAsync(cancellationToken);
        await managedOidcClientSynchronizer.SynchronizeClientAsync(oidcClient.Id, cancellationToken);

        return ApiResponses.Success(new CreateOidcClientResponse(oidcClient.Id));
    }
}
