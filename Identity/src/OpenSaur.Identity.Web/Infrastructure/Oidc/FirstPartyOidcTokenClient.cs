using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;
using OpenIddict.Server;
using System.Security.Claims;
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
        var hostedIdentityClient = _oidcOptions.Value.GetHostedIdentityClient();
        if (string.IsNullOrWhiteSpace(hostedIdentityClient.ClientId)
            || string.IsNullOrWhiteSpace(hostedIdentityClient.ClientSecret)
            || hostedIdentityClient.RedirectUris.Count == 0)
        {
            throw new InvalidOperationException("OIDC hosted identity client configuration is required.");
        }

        return await ProcessTokenRequestAsync(
            new OpenIddictRequest
            {
                GrantType = GrantTypes.AuthorizationCode,
                ClientId = hostedIdentityClient.ClientId,
                ClientSecret = hostedIdentityClient.ClientSecret,
                RedirectUri = hostedIdentityClient.RedirectUris[0],
                Code = code
            },
            cancellationToken);
    }

    public async Task<FirstPartyOidcTokenResult?> RefreshAccessTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var hostedIdentityClient = _oidcOptions.Value.GetHostedIdentityClient();
        if (string.IsNullOrWhiteSpace(hostedIdentityClient.ClientId)
            || string.IsNullOrWhiteSpace(hostedIdentityClient.ClientSecret))
        {
            throw new InvalidOperationException("OIDC hosted identity client configuration is required.");
        }

        return await ProcessTokenRequestAsync(
            new OpenIddictRequest
            {
                GrantType = GrantTypes.RefreshToken,
                ClientId = hostedIdentityClient.ClientId,
                ClientSecret = hostedIdentityClient.ClientSecret,
                RefreshToken = refreshToken
            },
            cancellationToken);
    }

    public async Task<FirstPartyOidcTokenResult?> IssueTokensAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var hostedIdentityClient = _oidcOptions.Value.GetHostedIdentityClient();
        if (string.IsNullOrWhiteSpace(hostedIdentityClient.ClientId))
        {
            throw new InvalidOperationException("OIDC hosted identity client configuration is required.");
        }

        var transaction = await CreateTransactionAsync(
            new OpenIddictRequest
            {
                ClientId = hostedIdentityClient.ClientId
            },
            cancellationToken);

        return await ProcessSignInAsync(transaction, transaction.Request!, principal);
    }

    private async Task<FirstPartyOidcTokenResult?> ProcessTokenRequestAsync(
        OpenIddictRequest request,
        CancellationToken cancellationToken)
    {
        var transaction = await CreateTransactionAsync(request, cancellationToken);

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

        return await ProcessSignInAsync(transaction, request, principal);
    }

    private async Task<OpenIddictServerTransaction> CreateTransactionAsync(
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
        return transaction;
    }

    private async Task<FirstPartyOidcTokenResult?> ProcessSignInAsync(
        OpenIddictServerTransaction transaction,
        OpenIddictRequest request,
        ClaimsPrincipal principal)
    {
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
            ?? DateTimeOffset.UtcNow.Add(OidcDefaults.AccessTokenLifetime);

        return new FirstPartyOidcTokenResult(
            signInContext.AccessToken,
            signInContext.RefreshToken,
            expiresAt);
    }
}
