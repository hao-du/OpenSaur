using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Features.Auth.Services;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class AuthorizeHandler(
    IHttpContextAccessor httpContextAccessor,
    ApplicationDbContext dbContext,
    UserRolePermissionService authorizationDataService,
    UserManager<ApplicationUser> userManager)
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

        // Rebuild the token principal from the current user/workspace/role state before issuing code/tokens.
        var principal = await UserTokenPrincipalBuilder.BuildUserClaimPrincipalAsync(
            authenticationResult.Principal,
            request.GetScopes(),
            dbContext,
            authorizationDataService,
            userManager,
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
