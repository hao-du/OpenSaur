using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;
using OpenSaur.Identity.Web.Domain.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Seeding;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class ManagedOidcClientSynchronizer(
    ApplicationDbContext dbContext,
    ManagedOidcClientResolver managedOidcClientResolver,
    IOpenIddictApplicationManager applicationManager,
    IOptions<OidcOptions> oidcOptionsAccessor,
    ILogger<ManagedOidcClientSynchronizer> logger)
{
    public async Task EnsureSynchronizedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await BootstrapLegacyFirstPartyClientAsync(cancellationToken);

            var managedClients = await managedOidcClientResolver.GetClientsAsync(activeOnly: false, cancellationToken);
            foreach (var managedClient in managedClients)
            {
                await SynchronizeClientAsync(managedClient, cancellationToken);
            }
        }
        catch (DbException exception)
        {
            logger.LogWarning(
                exception,
                "Skipping managed OIDC client synchronization because the persistence store is not ready.");
        }
    }

    public async Task SynchronizeClientAsync(Guid oidcClientId, CancellationToken cancellationToken = default)
    {
        try
        {
            var managedClient = (await managedOidcClientResolver.GetClientsAsync(activeOnly: false, cancellationToken))
                .SingleOrDefault(candidate => candidate.Id == oidcClientId);
            if (managedClient is null)
            {
                return;
            }

            await SynchronizeClientAsync(managedClient, cancellationToken);
        }
        catch (DbException exception)
        {
            logger.LogWarning(
                exception,
                "Skipping managed OIDC client synchronization for {OidcClientId} because the persistence store is not ready.",
                oidcClientId);
        }
    }

    private async Task SynchronizeClientAsync(
        ManagedOidcClientRuntime managedClient,
        CancellationToken cancellationToken)
    {
        var application = await applicationManager.FindByClientIdAsync(managedClient.ClientId, cancellationToken);
        if (!managedClient.IsActive)
        {
            if (application is not null)
            {
                await applicationManager.DeleteAsync(application, cancellationToken);
            }

            return;
        }

        var descriptor = CreateDescriptor(managedClient);
        if (application is null)
        {
            await applicationManager.CreateAsync(descriptor, cancellationToken);
            return;
        }

        await applicationManager.UpdateAsync(application, descriptor, cancellationToken);
    }

    private async Task BootstrapLegacyFirstPartyClientAsync(CancellationToken cancellationToken)
    {
        if (await dbContext.OidcClients.AnyAsync(cancellationToken))
        {
            return;
        }

        var bootstrapClient = oidcOptionsAccessor.Value.BootstrapClient;
        if (string.IsNullOrWhiteSpace(bootstrapClient.ClientId)
            || bootstrapClient.Origins.Count == 0)
        {
            return;
        }

        var managedClient = new OidcClient
        {
            AppPathBase = ManagedOidcClientResolver.NormalizePathBase(bootstrapClient.AppPathBase),
            CallbackPath = ManagedOidcClientResolver.NormalizeRelativePath(bootstrapClient.CallbackPath),
            ClientId = bootstrapClient.ClientId.Trim(),
            ClientSecret = bootstrapClient.ClientSecret.Trim(),
            Description = "Bootstrapped from OIDC configuration.",
            DisplayName = string.IsNullOrWhiteSpace(bootstrapClient.DisplayName)
                ? bootstrapClient.ClientId.Trim()
                : bootstrapClient.DisplayName.Trim(),
            PostLogoutPath = ManagedOidcClientResolver.NormalizeRelativePath(bootstrapClient.PostLogoutPath),
            Scope = string.IsNullOrWhiteSpace(bootstrapClient.Scope)
                ? "openid profile email roles offline_access api"
                : bootstrapClient.Scope.Trim(),
            CreatedBy = IdentitySeedData.SystemAdministratorUserId,
            IsActive = true,
            Origins = bootstrapClient.Origins
                .Where(origin => !string.IsNullOrWhiteSpace(origin))
                .Select(
                    origin => new OidcClientOrigin
                    {
                        BaseUri = ManagedOidcClientResolver.NormalizeOrigin(origin),
                        CreatedBy = IdentitySeedData.SystemAdministratorUserId,
                        Description = "Bootstrapped from OIDC configuration.",
                        IsActive = true
                    })
                .ToList()
        };

        if (managedClient.Origins.Count == 0)
        {
            return;
        }

        dbContext.OidcClients.Add(managedClient);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static OpenIddictApplicationDescriptor CreateDescriptor(ManagedOidcClientRuntime managedClient)
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = managedClient.ClientId,
            ClientSecret = managedClient.ClientSecret,
            ClientType = string.IsNullOrWhiteSpace(managedClient.ClientSecret)
                ? OpenIddictConstants.ClientTypes.Public
                : OpenIddictConstants.ClientTypes.Confidential,
            ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
            DisplayName = string.IsNullOrWhiteSpace(managedClient.DisplayName)
                ? managedClient.ClientId
                : managedClient.DisplayName
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

        foreach (var redirectUri in managedClient.RedirectUris)
        {
            descriptor.RedirectUris.Add(new Uri(redirectUri));
        }

        foreach (var postLogoutRedirectUri in managedClient.PostLogoutRedirectUris)
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.PostLogoutRedirectUris.Add(new Uri(postLogoutRedirectUri));
        }

        return descriptor;
    }
}
