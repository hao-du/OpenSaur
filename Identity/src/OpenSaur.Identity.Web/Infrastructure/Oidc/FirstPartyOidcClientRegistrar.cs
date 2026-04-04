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
        foreach (var browserClient in oidcOptions.Value.BrowserClients.Values)
        {
            if (string.IsNullOrWhiteSpace(browserClient.ClientId)
                || browserClient.RedirectUris.Count == 0)
            {
                continue;
            }

            try
            {
                var descriptor = CreateDescriptor(browserClient);
                var application = await applicationManager.FindByClientIdAsync(browserClient.ClientId, cancellationToken);
                if (application is null)
                {
                    await applicationManager.CreateAsync(descriptor, cancellationToken);
                    continue;
                }

                await applicationManager.UpdateAsync(application, descriptor, cancellationToken);
            }
            catch (DbException exception)
            {
                logger.LogWarning(
                    exception,
                    "Skipping browser OIDC client registration because the OpenIddict store is not ready.");
                return;
            }
        }
    }

    private static OpenIddictApplicationDescriptor CreateDescriptor(BrowserClientOidcOptions browserClient)
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = browserClient.ClientId,
            ClientSecret = browserClient.ClientSecret,
            ClientType = string.IsNullOrWhiteSpace(browserClient.ClientSecret)
                ? OpenIddictConstants.ClientTypes.Public
                : OpenIddictConstants.ClientTypes.Confidential,
            ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
            DisplayName = string.IsNullOrWhiteSpace(browserClient.DisplayName)
                ? browserClient.ClientId
                : browserClient.DisplayName
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

        foreach (var redirectUri in browserClient.RedirectUris.Where(uri => !string.IsNullOrWhiteSpace(uri)))
        {
            descriptor.RedirectUris.Add(new Uri(redirectUri));
        }

        foreach (var postLogoutRedirectUri in browserClient.PostLogoutRedirectUris.Where(uri => !string.IsNullOrWhiteSpace(uri)))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.PostLogoutRedirectUris.Add(new Uri(postLogoutRedirectUri));
        }

        return descriptor;
    }
}
