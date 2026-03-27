using System.Data.Common;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class FirstPartyOidcClientRegistrar(
    IOpenIddictApplicationManager applicationManager,
    IOptions<OidcOptions> oidcOptions,
    ILogger<FirstPartyOidcClientRegistrar> logger)
{
    public async Task EnsureConfiguredClientAsync(CancellationToken cancellationToken = default)
    {
        var firstPartyWeb = oidcOptions.Value.FirstPartyWeb;
        if (string.IsNullOrWhiteSpace(firstPartyWeb.ClientId)
            || string.IsNullOrWhiteSpace(firstPartyWeb.RedirectUri))
        {
            return;
        }

        try
        {
            var descriptor = CreateDescriptor(firstPartyWeb);
            var application = await applicationManager.FindByClientIdAsync(firstPartyWeb.ClientId, cancellationToken);
            if (application is null)
            {
                await applicationManager.CreateAsync(descriptor, cancellationToken);
                return;
            }

            await applicationManager.UpdateAsync(application, descriptor, cancellationToken);
        }
        catch (DbException exception)
        {
            logger.LogWarning(
                exception,
                "Skipping first-party OIDC client registration because the OpenIddict store is not ready.");
        }
    }

    private static OpenIddictApplicationDescriptor CreateDescriptor(FirstPartyWebOidcOptions firstPartyWeb)
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = firstPartyWeb.ClientId,
            ClientSecret = firstPartyWeb.ClientSecret,
            ClientType = string.IsNullOrWhiteSpace(firstPartyWeb.ClientSecret)
                ? OpenIddictConstants.ClientTypes.Public
                : OpenIddictConstants.ClientTypes.Confidential,
            ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
            DisplayName = "OpenSaur Identity First-Party Web"
        };

        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Authorization);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Token);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.RefreshToken);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.ResponseTypes.Code);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Scopes.Profile);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Scopes.Email);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Scopes.Roles);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + "api");
        descriptor.RedirectUris.Add(new Uri(firstPartyWeb.RedirectUri));

        return descriptor;
    }
}
