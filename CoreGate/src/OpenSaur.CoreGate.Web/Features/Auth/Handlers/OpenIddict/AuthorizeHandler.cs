using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Features.Auth.Services;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Security.Claims;
using CoreGateClaimTypes = OpenSaur.CoreGate.Web.Infrastructure.Security.ClaimTypes;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class AuthorizeHandler(
    IHttpContextAccessor httpContextAccessor,
    ClaimService claimService,
    ScopeValidationService scopeValidationService,
    IOpenIddictApplicationManager applicationManager,
    IOpenIddictAuthorizationManager authorizationManager)
{
    public async Task<IResult> HandleAuthorizeAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

        var (validationError, application) = await ValidateClientAndScopesAsync(request, httpContext.RequestAborted);
        if (validationError is not null)
        {
            return validationError;
        }

        var authenticationResult = await httpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!authenticationResult.Succeeded || authenticationResult.Principal is null)
        {
            return RedirectToLogin(httpContext.Request);
        }

        var userId = ClaimPrincipalHelpers.GetUserId(authenticationResult.Principal);
        var (requiresConsent, matchingAuthorization) = await CheckConsentAsync(
            userId!,
            application!,
            request,
            httpContext.RequestAborted);

        if (requiresConsent)
        {
            return RedirectToConsent(httpContext.Request);
        }

        var (impersonatedUserId, workspaceId) = ExtractImpersonationAndWorkspaceContext(httpContext.Request, authenticationResult.Principal);

        var principal = await claimService.BuildUserClaimPrincipalAsync(
            authenticationResult.Principal,
            request.GetScopes(),
            impersonatedUserId,
            workspaceId,
            httpContext.RequestAborted);

        if (principal is null)
        {
            await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
            return RedirectToLogin(httpContext.Request);
        }

        if (matchingAuthorization is not null)
        {
            var authorizationId = await authorizationManager.GetIdAsync(matchingAuthorization, httpContext.RequestAborted);
            if (!string.IsNullOrWhiteSpace(authorizationId))
            {
                principal.SetAuthorizationId(authorizationId);
            }
        }

        await UpdateSessionCookieIfNeededAsync(httpContext, authenticationResult.Principal, impersonatedUserId, workspaceId);

        return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private async Task<(bool RequiresConsent, object? MatchingAuthorization)> CheckConsentAsync(
        string userId,
        object application,
        OpenIddictRequest request,
        CancellationToken cancellationToken)
    {
        if (request.HasPromptValue(OpenIddictConstants.PromptValues.Consent))
        {
            return (true, null);
        }

        var applicationId = await applicationManager.GetIdAsync(application, cancellationToken);
        var requestedScopes = System.Collections.Immutable.ImmutableArray.CreateRange(request.GetScopes());

        await foreach (var authorization in authorizationManager.FindAsync(
            userId,
            applicationId,
            OpenIddictConstants.Statuses.Valid,
            OpenIddictConstants.AuthorizationTypes.Permanent,
            requestedScopes,
            cancellationToken))
        {
            return (false, authorization);
        }

        return (true, null);
    }

    private async Task<(IResult? ErrorResult, object? Application)> ValidateClientAndScopesAsync(OpenIddictRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ClientId))
        {
            return (Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.InvalidClient,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The client application identifier is missing."
                })), null);
        }

        var application = await applicationManager.FindByClientIdAsync(request.ClientId, cancellationToken);
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

        var scopeResult = await scopeValidationService.ValidateScopesAsync(application, request.GetScopes(), cancellationToken);
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

        return (null, application);
    }

    private static (string? ImpersonatedUserId, string? WorkspaceId) ExtractImpersonationAndWorkspaceContext(HttpRequest request, ClaimsPrincipal principal)
    {
        var impersonatedUserId = request.Query.TryGetValue(CoreGateClaimTypes.ImpersonatedUserId, out var userIdValue)
            ? userIdValue.ToString()
            : ClaimPrincipalHelpers.GetImpersonatedUserId(principal);

        var workspaceId = request.Query.TryGetValue(CoreGateClaimTypes.WorkspaceId, out var workspaceIdValue)
            ? workspaceIdValue.ToString()
            : ClaimPrincipalHelpers.GetWorkspaceId(principal);

        return (impersonatedUserId, workspaceId);
    }

    private static IResult RedirectToLogin(HttpRequest request)
    {
        var redirectUri = request.PathBase + request.Path + request.QueryString;
        return Results.Redirect($"/login?returnUrl={Uri.EscapeDataString(redirectUri)}");
    }

    private static IResult RedirectToConsent(HttpRequest request)
    {
        var redirectUri = request.PathBase + request.Path + request.QueryString;
        return Results.Redirect($"/consent?returnUrl={Uri.EscapeDataString(redirectUri)}");
    }

    private static async Task UpdateSessionCookieIfNeededAsync(HttpContext httpContext, ClaimsPrincipal principal, string? impersonatedUserId, string? workspaceId)
    {
        var shouldUpdateCookie = false;
        if (!string.IsNullOrWhiteSpace(impersonatedUserId))
        {
            ClaimPrincipalHelpers.AddOrReplaceClaim(principal, CoreGateClaimTypes.ImpersonatedUserId, impersonatedUserId);
            shouldUpdateCookie = true;
        }
        if (!string.IsNullOrWhiteSpace(workspaceId))
        {
            ClaimPrincipalHelpers.AddOrReplaceClaim(principal, CoreGateClaimTypes.WorkspaceId, workspaceId);
            shouldUpdateCookie = true;
        }
        if (shouldUpdateCookie)
        {
            await httpContext.SignInAsync(
                IdentityConstants.ApplicationScheme,
                principal,
                new AuthenticationProperties { IsPersistent = false });
        }
    }
}
