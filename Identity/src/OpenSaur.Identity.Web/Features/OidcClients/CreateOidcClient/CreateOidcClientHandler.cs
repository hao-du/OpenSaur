using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.OidcClients.CreateOidcClient;

public static class CreateOidcClientHandler
{
    public static async Task<IResult> HandleAsync(
        CreateOidcClientRequest request,
        IValidator<CreateOidcClientRequest> validator,
        ApplicationDbContext dbContext,
        IOpenIddictApplicationManager applicationManager,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
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

        var metadata = new OpenIddictApplicationMetadata(
            normalizedAppPathBase,
            normalizedCallbackPath,
            request.Description.Trim(),
            true,
            normalizedOrigins,
            normalizedPostLogoutPath,
            request.Scope.Trim());
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = normalizedClientId,
            DisplayName = request.DisplayName.Trim(),
            ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
            ClientType = string.IsNullOrWhiteSpace(request.ClientSecret)
                ? OpenIddictConstants.ClientTypes.Public
                : OpenIddictConstants.ClientTypes.Confidential
        };
        if (!string.IsNullOrWhiteSpace(request.ClientSecret))
        {
            descriptor.ClientSecret = request.ClientSecret.Trim();
        }

        ApplyApplicationConfiguration(descriptor, metadata);

        await applicationManager.CreateAsync(descriptor, cancellationToken);
        var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .AsNoTracking()
            .SingleAsync(client => client.ClientId == normalizedClientId, cancellationToken);

        return ApiResponses.Success(new CreateOidcClientResponse(application.Id));
    }

    internal static void ApplyApplicationConfiguration(
        OpenIddictApplicationDescriptor descriptor,
        OpenIddictApplicationMetadata metadata)
    {
        descriptor.RedirectUris.Clear();
        descriptor.PostLogoutRedirectUris.Clear();
        descriptor.Permissions.Clear();

        OpenIddictApplicationMetadataMapper.ApplyToDescriptor(descriptor, metadata);

        if (!metadata.IsActive)
        {
            return;
        }

        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Authorization);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Token);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.RefreshToken);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.ResponseTypes.Code);

        foreach (var scope in metadata.Scope
                     .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                     .Distinct(StringComparer.Ordinal))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + scope);
        }

        foreach (var redirectUri in metadata.RedirectUris)
        {
            descriptor.RedirectUris.Add(new Uri(redirectUri));
        }

        foreach (var postLogoutRedirectUri in metadata.PostLogoutRedirectUris)
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.PostLogoutRedirectUris.Add(new Uri(postLogoutRedirectUri));
        }
    }
}
