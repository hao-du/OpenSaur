using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Features.Auth.Services;
using OpenSaur.CoreGate.Web.Infrastructure.Database;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class TokenHandler(
    IHttpContextAccessor httpContextAccessor,
    ClaimService claimService,
    ScopeValidationService scopeValidationService,
    IOpenIddictApplicationManager applicationManager
)
{
    public async Task<IResult> HandleTokenAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        // Back-channel OIDC step: the client app exchanges an auth code or refresh token directly with CoreGate.
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

        var grantTypeValidationResult = ValidateGrantType(request);
        if (grantTypeValidationResult is not null)
        {
            return grantTypeValidationResult;
        }

        var authenticateResult = await httpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            return Results.Forbid(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
        }

        if (request.IsClientCredentialsGrantType())
        {
            return await HandleClientCredentialsAsync(request, authenticateResult.Principal, httpContext.RequestAborted);
        }

        return await HandleUserTokenAsync(request, authenticateResult.Principal, httpContext.RequestAborted);
    }

    private async Task<IResult> HandleUserTokenAsync(
        OpenIddictRequest request,
        System.Security.Claims.ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (validationError, targetScopes) = await ValidateClientAndScopesAsync(
            request,
            principal,
            cancellationToken);

        if (validationError is not null)
        {
            return validationError;
        }

        // Refresh claims from the shared identity data before returning the final token response.
        var userPrincipal = await claimService.BuildUserClaimPrincipalAsync(
            principal,
            targetScopes!,
            impersonatedUserId: null,
            workspaceId: null,
            cancellationToken);

        return userPrincipal is null
            ? Results.Forbid(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme])
            : Results.SignIn(userPrincipal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private static IResult? ValidateGrantType(OpenIddictRequest request)
    {
        var isSupportedGrantType = request.IsAuthorizationCodeGrantType()
            || request.IsRefreshTokenGrantType()
            || request.IsClientCredentialsGrantType();

        if (!isSupportedGrantType)
        {
            return Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.UnsupportedGrantType,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The specified grant type is not supported."
                }));
        }

        return null;
    }

    private async Task<IResult> HandleClientCredentialsAsync(
        OpenIddictRequest request,
        System.Security.Claims.ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (clientError, application) = await ResolveApplicationAsync(request, principal, cancellationToken);
        if (clientError is not null)
        {
            return clientError;
        }

        var requestedScopes = request.GetScopes();
        var targetScopes = requestedScopes.Any()
            ? requestedScopes
            : (await applicationManager.GetPermissionsAsync(application!, cancellationToken))
                .Where(p => p.StartsWith(OpenIddictConstants.Permissions.Prefixes.Scope, StringComparison.Ordinal))
                .Select(p => p[OpenIddictConstants.Permissions.Prefixes.Scope.Length..]);

        var scopeResult = await scopeValidationService.ValidateScopesAsync(application!, targetScopes, cancellationToken);
        if (!scopeResult.Succeeded)
        {
            return Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.InvalidScope,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = scopeResult.ErrorDescription
                }));
        }

        var clientPrincipal = await claimService.BuildClientClaimPrincipalAsync(
            application!,
            targetScopes,
            cancellationToken);

        return clientPrincipal is null
            ? Results.Forbid(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme])
            : Results.SignIn(clientPrincipal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private async Task<(IResult? ErrorResult, IEnumerable<string>? Scopes)> ValidateClientAndScopesAsync(
        OpenIddictRequest request,
        System.Security.Claims.ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var (clientError, application) = await ResolveApplicationAsync(request, principal, cancellationToken);
        if (clientError is not null)
        {
            return (clientError, null);
        }

        var originalScopes = principal.GetScopes();
        var requestedScopes = request.GetScopes();

        if (requestedScopes.Any())
        {
            var originalScopeSet = originalScopes.ToHashSet(StringComparer.Ordinal);
            if (requestedScopes.Any(scope => !originalScopeSet.Contains(scope)))
            {
                return (Results.Forbid(
                    authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                    properties: new AuthenticationProperties(new Dictionary<string, string?>
                    {
                        [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.InvalidScope,
                        [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The requested scope exceeds the scopes granted in the original authorization."
                    })), null);
            }
        }

        var targetScopes = requestedScopes.Any() ? requestedScopes : originalScopes;

        var scopeResult = await scopeValidationService.ValidateScopesAsync(application!, targetScopes, cancellationToken);
        if (!scopeResult.Succeeded)
        {
            return (Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.InvalidScope,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = scopeResult.ErrorDescription
                })), null);
        }

        return (null, targetScopes);
    }

    private async Task<(IResult? ErrorResult, object? Application)> ResolveApplicationAsync(
        OpenIddictRequest request,
        System.Security.Claims.ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var clientId = request.ClientId ?? principal.GetPresenters().FirstOrDefault();
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return (Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.InvalidClient,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The client application identifier could not be resolved."
                })), null);
        }

        var application = await applicationManager.FindByClientIdAsync(clientId, cancellationToken);
        if (application is null)
        {
            return (Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.InvalidClient,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The specified client application was not found."
                })), null);
        }

        return (null, application);
    }
}
