using System.Security.Claims;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;

namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class OpenIddictAuthorizationFlow
{
    public static IEndpointRouteBuilder MapOpenIddictEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapMethods("/connect/authorize", [HttpMethods.Get, HttpMethods.Post], async (
                HttpContext httpContext,
                ApplicationDbContext dbContext,
                UserAuthorizationDataService authorizationDataService,
                UserManager<ApplicationUser> userManager) =>
            await HandleAuthorizeAsync(httpContext, dbContext, authorizationDataService, userManager))
            .AllowAnonymous();
        app.MapPost("/connect/token", async (
                HttpContext httpContext,
                ApplicationDbContext dbContext,
                UserAuthorizationDataService authorizationDataService,
                UserManager<ApplicationUser> userManager) =>
            await HandleTokenAsync(httpContext, dbContext, authorizationDataService, userManager))
            .AllowAnonymous();
        app.MapGet("/connect/userinfo", async (HttpContext httpContext) => await HandleUserInfoAsync(httpContext))
            .AllowAnonymous();

        return app;
    }

    private static async Task<IResult> HandleAuthorizeAsync(
        HttpContext httpContext,
        ApplicationDbContext dbContext,
        UserAuthorizationDataService authorizationDataService,
        UserManager<ApplicationUser> userManager)
    {
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

        var authenticationResult = await httpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!authenticationResult.Succeeded || authenticationResult.Principal is null)
        {
            var redirectUri = httpContext.Request.PathBase + httpContext.Request.Path + httpContext.Request.QueryString;
            return Results.Redirect($"/auth/login?returnUrl={Uri.EscapeDataString(redirectUri)}");
        }

        var principal = await BuildTokenPrincipalAsync(
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
            return Results.Redirect($"/auth/login?returnUrl={Uri.EscapeDataString(redirectUri)}");
        }

        return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private static async Task<IResult> HandleTokenAsync(
        HttpContext httpContext,
        ApplicationDbContext dbContext,
        UserAuthorizationDataService authorizationDataService,
        UserManager<ApplicationUser> userManager)
    {
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

        if (!request.IsAuthorizationCodeGrantType() && !request.IsRefreshTokenGrantType())
        {
            return Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.UnsupportedGrantType,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The specified grant type is not supported."
                }));
        }

        var authenticateResult = await httpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            return Results.Forbid(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
        }

        var principal = await BuildTokenPrincipalAsync(
            authenticateResult.Principal,
            authenticateResult.Principal.GetScopes(),
            dbContext,
            authorizationDataService,
            userManager,
            httpContext.RequestAborted);

        return principal is null
            ? Results.Forbid(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme])
            : Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private static async Task<IResult> HandleUserInfoAsync(HttpContext httpContext)
    {
        var authenticateResult = await httpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            return Results.Challenge(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
        }

        var principal = authenticateResult.Principal;
        var payload = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            [OpenIddictConstants.Claims.Subject] = principal.FindFirst(ApplicationClaimTypes.Subject)?.Value,
            [OpenIddictConstants.Claims.PreferredUsername] = principal.FindFirst(ApplicationClaimTypes.PreferredUserName)?.Value,
            [OpenIddictConstants.Claims.Email] = principal.FindFirst(OpenIddictConstants.Claims.Email)?.Value,
            [ApplicationClaimTypes.WorkspaceId] = principal.FindFirst(ApplicationClaimTypes.WorkspaceId)?.Value
        };

        var roles = principal.FindAll(ApplicationClaimTypes.Role).Select(static claim => claim.Value).ToArray();
        if (roles.Length > 0)
        {
            payload[ApplicationClaimTypes.Role] = roles;
        }

        return Results.Json(payload.Where(static kvp => kvp.Value is not null).ToDictionary());
    }

    private static async Task<ClaimsPrincipal?> BuildTokenPrincipalAsync(
        ClaimsPrincipal sourcePrincipal,
        IEnumerable<string> requestedScopes,
        ApplicationDbContext dbContext,
        UserAuthorizationDataService authorizationDataService,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        var userId = AuthPrincipalReader.GetUserId(sourcePrincipal);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return null;
        }

        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == user.WorkspaceId && candidate.IsActive, cancellationToken);
        if (workspace is null)
        {
            return null;
        }

        var roles = await authorizationDataService.GetActiveNormalizedRoleNamesForUserAsync(user.Id, workspace.Id, cancellationToken);
        var permissions = await authorizationDataService.GetGrantedPermissionCodesAsync(user.Id, workspace.Id, cancellationToken);

        return AuthSessionPrincipalFactory.Create(user, roles, permissions, requestedScopes);
    }
}
