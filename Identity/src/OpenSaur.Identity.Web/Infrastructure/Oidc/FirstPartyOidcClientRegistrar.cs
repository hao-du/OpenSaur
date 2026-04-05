namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class FirstPartyOidcClientRegistrar(ManagedOidcClientSynchronizer managedOidcClientSynchronizer)
{
    public Task EnsureConfiguredClientAsync(CancellationToken cancellationToken = default)
    {
        return managedOidcClientSynchronizer.EnsureSynchronizedAsync(cancellationToken);
    }
}
