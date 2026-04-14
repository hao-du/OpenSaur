using FluentValidation;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Validation;
using OpenSaur.Identity.Web.Features.OidcClients.CreateOidcClient;

namespace OpenSaur.Identity.Web.Features.OidcClients.EditOidcClient;

public static class EditOidcClientHandler
{
    public static async Task<IResult> HandleAsync(
        EditOidcClientRequest request,
        IValidator<EditOidcClientRequest> validator,
        ApplicationDbContext dbContext,
        IOpenIddictApplicationManager applicationManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .SingleOrDefaultAsync(client => client.Id == request.Id, cancellationToken);
        if (application is null)
        {
            return Result.NotFound(
                    "OIDC client not found.",
                    "No managed OIDC client matched the provided identifier.")
                .ToApiErrorResult();
        }

        var normalizedClientId = request.ClientId.Trim();
        var normalizedAppPathBase = OidcClientRequestNormalization.NormalizeAppPathBase(request.AppPathBase);
        var normalizedCallbackPath = OidcClientRequestNormalization.NormalizeClientPath(request.CallbackPath);
        var normalizedOrigins = OidcClientRequestNormalization.NormalizeOrigins(request.Origins);
        var normalizedPostLogoutPath = OidcClientRequestNormalization.NormalizeClientPath(request.PostLogoutPath);
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

        var descriptor = new OpenIddictApplicationDescriptor();
        await applicationManager.PopulateAsync(descriptor, application, cancellationToken);

        descriptor.ClientId = normalizedClientId;
        descriptor.DisplayName = request.DisplayName.Trim();
        descriptor.ClientType = string.IsNullOrWhiteSpace(request.ClientSecret)
            && string.IsNullOrWhiteSpace(descriptor.ClientSecret)
            ? OpenIddictConstants.ClientTypes.Public
            : OpenIddictConstants.ClientTypes.Confidential;
        if (!string.IsNullOrWhiteSpace(request.ClientSecret))
        {
            descriptor.ClientSecret = request.ClientSecret.Trim();
        }

        var metadata = new OpenIddictApplicationMetadata(
            normalizedAppPathBase,
            normalizedCallbackPath,
            request.Description.Trim(),
            request.IsActive,
            normalizedOrigins,
            normalizedPostLogoutPath,
            request.Scope.Trim());
        CreateOidcClientHandler.ApplyApplicationConfiguration(descriptor, metadata);

        await applicationManager.UpdateAsync(application, descriptor, cancellationToken);

        return ApiResponses.NoContent();
    }
}
