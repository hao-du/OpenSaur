using OpenIddict.Server;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

internal sealed class InternalFirstPartyTokenResponseHandler
    : IOpenIddictServerHandler<OpenIddictServerEvents.ApplyTokenResponseContext>
{
    internal const string TransactionPropertyName = "opensaur.identity.internal_first_party_token_request";

    public ValueTask HandleAsync(OpenIddictServerEvents.ApplyTokenResponseContext context)
    {
        if (context.Transaction.Properties.TryGetValue(TransactionPropertyName, out var marker)
            && marker is true)
        {
            context.HandleRequest();
        }

        return default;
    }
}
