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
    ApplicationDbContext dbContext,
    UserRolePermissionService authorizationDataService,
    UserManager<ApplicationUser> userManager
)
{
    public async Task<IResult> HandleTokenAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        // Back-channel OIDC step: the client app exchanges an auth code or refresh token directly with CoreGate.
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

        // Refresh claims from the shared identity data before returning the final token response.
        var principal = await UserTokenPrincipalBuilder.BuildUserClaimPrincipalAsync(
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
}
