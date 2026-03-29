using System.Security.Claims;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;
using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;
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
                UserRoleRepository userRoleRepository,
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

                var userId = AuthPrincipalReader.GetUserId(authenticationResult.Principal);
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

                var effectiveWorkspaceId = AuthPrincipalReader.GetImpersonationWorkspaceId(authenticationResult.Principal)
                    ?? user.WorkspaceId;
                var workspace = await dbContext.Workspaces.FindAsync(effectiveWorkspaceId);
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

                var rolesResult = await userRoleRepository.GetActiveNormalizedRoleNamesForUserAsync(
                    new GetActiveNormalizedRoleNamesForUserRequest(user.Id, effectiveWorkspaceId),
                    httpContext.RequestAborted);
                var principal = AuthSessionPrincipalFactory.Create(
                    user,
                    rolesResult.Value?.NormalizedRoleNames ?? [],
                    request.GetScopes(),
                    workspaceOverrideId: effectiveWorkspaceId,
                    isImpersonating: AuthPrincipalReader.IsImpersonating(authenticationResult.Principal),
                    impersonationOriginalUserId: AuthPrincipalReader.GetImpersonationOriginalUserId(authenticationResult.Principal));

                return Results.SignIn(
                    principal,
                    authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            })
            .AllowAnonymous()
            .WithResilienceScope(EndpointResiliencePolicyScope.Token);

        return app;
    }

    private static string BuildCurrentRequestPathAndQuery(HttpContext httpContext)
    {
        return $"{httpContext.Request.PathBase}{httpContext.Request.Path}{httpContext.Request.QueryString}";
    }
}
