using System.Security.Claims;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Resilience;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth.Oidc;

public static class OidcEndpoints
{
    public static IEndpointRouteBuilder MapOidcEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapMethods(
            "/connect/authorize",
            [HttpMethods.Get, HttpMethods.Post],
            async Task<IResult>(
                HttpContext httpContext,
                ApplicationDbContext dbContext,
                UserManager<ApplicationUser> userManager) =>
            {
                var request = httpContext.GetOpenIddictServerRequest()
                    ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

                var authenticationResult = await httpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
                if (!authenticationResult.Succeeded || authenticationResult.Principal is null)
                {
                    return Results.Challenge(
                        new AuthenticationProperties
                        {
                            RedirectUri = BuildCurrentRequestPathAndQuery(httpContext)
                        },
                        [IdentityConstants.ApplicationScheme]);
                }

                var userId = GetUserId(authenticationResult.Principal);
                if (string.IsNullOrWhiteSpace(userId))
                {
                    await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

                    return Results.Challenge(
                        new AuthenticationProperties
                        {
                            RedirectUri = BuildCurrentRequestPathAndQuery(httpContext)
                        },
                        [IdentityConstants.ApplicationScheme]);
                }

                var user = await userManager.FindByIdAsync(userId);
                if (user is null || !user.IsActive)
                {
                    await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

                    return Results.Challenge(
                        new AuthenticationProperties
                        {
                            RedirectUri = BuildCurrentRequestPathAndQuery(httpContext)
                        },
                        [IdentityConstants.ApplicationScheme]);
                }

                var workspace = await dbContext.Workspaces.FindAsync(user.WorkspaceId);
                if (workspace is null || !workspace.IsActive)
                {
                    await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

                    return Results.Challenge(
                        new AuthenticationProperties
                        {
                            RedirectUri = BuildCurrentRequestPathAndQuery(httpContext)
                        },
                        [IdentityConstants.ApplicationScheme]);
                }

                var roles = await userManager.GetRolesAsync(user);
                var principal = CreatePrincipal(user, roles, request);

                return Results.SignIn(
                    principal,
                    authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            })
            .AllowAnonymous()
            .WithResilienceScope(EndpointResiliencePolicyScope.Token);

        return app;
    }

    private static ClaimsPrincipal CreatePrincipal(
        ApplicationUser user,
        IEnumerable<string> roles,
        OpenIddictRequest request)
    {
        var identity = new ClaimsIdentity(
            TokenValidationParameters.DefaultAuthenticationType,
            ApplicationClaimTypes.Name,
            ApplicationClaimTypes.Role);

        identity.AddClaim(new Claim(ApplicationClaimTypes.Subject, user.Id.ToString()));
        identity.AddClaim(new Claim(ApplicationClaimTypes.Name, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ApplicationClaimTypes.PreferredUserName, user.UserName ?? string.Empty));
        identity.AddClaim(new Claim(ApplicationClaimTypes.WorkspaceId, user.WorkspaceId.ToString()));
        identity.AddClaim(new Claim(ApplicationClaimTypes.RequirePasswordChange, user.RequirePasswordChange.ToString().ToLowerInvariant()));

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Email, user.Email));
        }

        foreach (var role in roles)
        {
            identity.AddClaim(new Claim(ApplicationClaimTypes.Role, role));
        }

        var principal = new ClaimsPrincipal(identity);
        principal.SetScopes(request.GetScopes());

        if (request.GetScopes().Contains("api", StringComparer.Ordinal))
        {
            principal.SetResources("api");
        }

        principal.SetDestinations(static claim => claim.Type switch
        {
            ApplicationClaimTypes.Subject => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ApplicationClaimTypes.Name or ApplicationClaimTypes.PreferredUserName
                when claim.Subject is ClaimsIdentity profileIdentity
                     && profileIdentity.HasScope(OpenIddictConstants.Scopes.Profile)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            OpenIddictConstants.Claims.Email
                when claim.Subject is ClaimsIdentity emailIdentity
                     && emailIdentity.HasScope(OpenIddictConstants.Scopes.Email)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ApplicationClaimTypes.Role
                when claim.Subject is ClaimsIdentity roleIdentity
                     && roleIdentity.HasScope(OpenIddictConstants.Scopes.Roles)
                => [OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken],
            ApplicationClaimTypes.WorkspaceId or ApplicationClaimTypes.RequirePasswordChange
                => [OpenIddictConstants.Destinations.AccessToken],
            _ => []
        });

        return principal;
    }

    private static string BuildCurrentRequestPathAndQuery(HttpContext httpContext)
    {
        return $"{httpContext.Request.PathBase}{httpContext.Request.Path}{httpContext.Request.QueryString}";
    }

    private static string? GetUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ApplicationClaimTypes.Subject)
               ?? principal.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
    }
}
