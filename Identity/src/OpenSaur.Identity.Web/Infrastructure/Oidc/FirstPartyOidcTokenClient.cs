using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;
using OpenIddict.Server;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public sealed class FirstPartyOidcTokenClient : IFirstPartyOidcTokenClient
{
    private readonly IOpenIddictServerDispatcher _dispatcher;
    private readonly IOpenIddictServerFactory _factory;
    private readonly IOptions<OidcOptions> _oidcOptions;

    public FirstPartyOidcTokenClient(
        IOpenIddictServerDispatcher dispatcher,
        IOpenIddictServerFactory factory,
        IOptions<OidcOptions> oidcOptions)
    {
        _dispatcher = dispatcher;
        _factory = factory;
        _oidcOptions = oidcOptions;
    }

    public async Task<FirstPartyOidcTokenResult?> ExchangeAuthorizationCodeAsync(
        string code,
        CancellationToken cancellationToken)
    {
        var firstPartyWeb = _oidcOptions.Value.FirstPartyWeb;
        if (string.IsNullOrWhiteSpace(firstPartyWeb.ClientId)
            || string.IsNullOrWhiteSpace(firstPartyWeb.ClientSecret)
            || string.IsNullOrWhiteSpace(firstPartyWeb.RedirectUri))
        {
            throw new InvalidOperationException("OIDC first-party web client configuration is required.");
        }

        return await ProcessTokenRequestAsync(
            new OpenIddictRequest
            {
                GrantType = GrantTypes.AuthorizationCode,
                ClientId = firstPartyWeb.ClientId,
                ClientSecret = firstPartyWeb.ClientSecret,
                RedirectUri = firstPartyWeb.RedirectUri,
                Code = code
            },
            cancellationToken);
    }

    public async Task<FirstPartyOidcTokenResult?> RefreshAccessTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var firstPartyWeb = _oidcOptions.Value.FirstPartyWeb;
        if (string.IsNullOrWhiteSpace(firstPartyWeb.ClientId)
            || string.IsNullOrWhiteSpace(firstPartyWeb.ClientSecret))
        {
            throw new InvalidOperationException("OIDC first-party web client configuration is required.");
        }

        return await ProcessTokenRequestAsync(
            new OpenIddictRequest
            {
                GrantType = GrantTypes.RefreshToken,
                ClientId = firstPartyWeb.ClientId,
                ClientSecret = firstPartyWeb.ClientSecret,
                RefreshToken = refreshToken
            },
            cancellationToken);
    }

    private async Task<FirstPartyOidcTokenResult?> ProcessTokenRequestAsync(
        OpenIddictRequest request,
        CancellationToken cancellationToken)
    {
        var issuer = _oidcOptions.Value.Issuer;
        if (!Uri.TryCreate(issuer, UriKind.Absolute, out var issuerUri))
        {
            throw new InvalidOperationException("OIDC issuer configuration is invalid.");
        }

        var transaction = await _factory.CreateTransactionAsync();
        transaction.CancellationToken = cancellationToken;
        transaction.EndpointType = OpenIddictServerEndpointType.Token;
        transaction.BaseUri = issuerUri;
        transaction.RequestUri = new Uri(issuerUri, "/connect/token");
        transaction.Request = request;
        transaction.Properties[InternalFirstPartyTokenResponseHandler.TransactionPropertyName] = true;

        var validateContext = new OpenIddictServerEvents.ValidateTokenRequestContext(transaction)
        {
            Request = request
        };
        await _dispatcher.DispatchAsync(validateContext);
        if (validateContext.IsRejected)
        {
            return null;
        }

        var principal = string.Equals(request.GrantType, GrantTypes.AuthorizationCode, StringComparison.Ordinal)
            ? validateContext.AuthorizationCodePrincipal
            : validateContext.RefreshTokenPrincipal;
        if (principal is null)
        {
            return null;
        }

        var signInContext = new OpenIddictServerEvents.ProcessSignInContext(transaction)
        {
            Request = request,
            Principal = principal,
            Response = new OpenIddictResponse()
        };
        await _dispatcher.DispatchAsync(signInContext);
        if (signInContext.IsRejected
            || string.IsNullOrWhiteSpace(signInContext.AccessToken)
            || string.IsNullOrWhiteSpace(signInContext.RefreshToken))
        {
            return null;
        }

        var expiresAt = signInContext.AccessTokenPrincipal?.GetExpirationDate()
            ?? DateTimeOffset.UtcNow.AddHours(1);

        return new FirstPartyOidcTokenResult(
            signInContext.AccessToken,
            signInContext.RefreshToken,
            expiresAt);
    }
}
