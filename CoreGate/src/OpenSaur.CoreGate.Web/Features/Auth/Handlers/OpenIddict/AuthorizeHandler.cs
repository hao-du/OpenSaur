using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Features.Auth.Services;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class AuthorizeHandler(
    IHttpContextAccessor httpContextAccessor,
    ClaimService claimService)
{
    public async Task<IResult> HandleAuthorizeAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        // Front-channel OIDC step: the browser lands here first and may need to be redirected to login.
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

        var authenticationResult = await httpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!authenticationResult.Succeeded || authenticationResult.Principal is null)
        {
            var redirectUri = httpContext.Request.PathBase + httpContext.Request.Path + httpContext.Request.QueryString;
            return Results.Redirect($"/login?returnUrl={Uri.EscapeDataString(redirectUri)}");
        }

        var impersonatedUserId = httpContext.Request.Query.TryGetValue("impersonated_user_id", out var userIdValue)
            ? userIdValue.ToString()
            : null;

        var workspaceId = httpContext.Request.Query.TryGetValue("workspace_id", out var workspaceIdValue)
            ? workspaceIdValue.ToString()
            : null;

        // Rebuild the token principal from the current user/workspace/role state before issuing code/tokens.
        var principal = await claimService.BuildUserClaimPrincipalAsync(
            authenticationResult.Principal,
            request.GetScopes(),
            impersonatedUserId,
            workspaceId,
            httpContext.RequestAborted);

        if (principal is null)
        {
            await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
            var redirectUri = httpContext.Request.PathBase + httpContext.Request.Path + httpContext.Request.QueryString;
            return Results.Redirect($"/login?returnUrl={Uri.EscapeDataString(redirectUri)}");
        }

        return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }
}
