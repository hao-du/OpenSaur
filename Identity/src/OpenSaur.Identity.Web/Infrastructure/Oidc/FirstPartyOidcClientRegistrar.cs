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
        var firstPartyClient = oidcOptions.Value.FirstPartyClient;
        if (string.IsNullOrWhiteSpace(firstPartyClient.ClientId)
            || firstPartyClient.RedirectUris.Count == 0)
        {
            return;
        }

        try
        {
            var descriptor = CreateDescriptor(firstPartyClient);
            var application = await applicationManager.FindByClientIdAsync(firstPartyClient.ClientId, cancellationToken);
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

    private static OpenIddictApplicationDescriptor CreateDescriptor(FirstPartyClientOidcOptions firstPartyClient)
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = firstPartyClient.ClientId,
            ClientSecret = firstPartyClient.ClientSecret,
            ClientType = string.IsNullOrWhiteSpace(firstPartyClient.ClientSecret)
                ? OpenIddictConstants.ClientTypes.Public
                : OpenIddictConstants.ClientTypes.Confidential,
            ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
            DisplayName = string.IsNullOrWhiteSpace(firstPartyClient.DisplayName)
                ? firstPartyClient.ClientId
                : firstPartyClient.DisplayName
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

        foreach (var redirectUri in firstPartyClient.RedirectUris.Where(uri => !string.IsNullOrWhiteSpace(uri)))
        {
            descriptor.RedirectUris.Add(new Uri(redirectUri));
        }

        foreach (var postLogoutRedirectUri in firstPartyClient.PostLogoutRedirectUris.Where(uri => !string.IsNullOrWhiteSpace(uri)))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.PostLogoutRedirectUris.Add(new Uri(postLogoutRedirectUri));
        }

        return descriptor;
    }
}
