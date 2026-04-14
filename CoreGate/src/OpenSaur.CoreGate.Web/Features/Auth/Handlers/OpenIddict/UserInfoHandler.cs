using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class UserInfoHandler(
    IHttpContextAccessor httpContextAccessor
)
{
    public async Task<IResult> HandleUserInfoAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        var authenticateResult = await httpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            return Results.Challenge(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
        }

        var principal = authenticateResult.Principal;
        var payload = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            [OpenIddictConstants.Claims.Subject] = principal.FindFirst(ClaimTypes.Subject)?.Value,
            [OpenIddictConstants.Claims.PreferredUsername] = principal.FindFirst(ClaimTypes.PreferredUserName)?.Value,
            [OpenIddictConstants.Claims.Email] = principal.FindFirst(OpenIddictConstants.Claims.Email)?.Value,
            [ClaimTypes.WorkspaceId] = principal.FindFirst(ClaimTypes.WorkspaceId)?.Value
        };

        var roles = principal.FindAll(ClaimTypes.Role).Select(static claim => claim.Value).ToArray();
        if (roles.Length > 0)
        {
            payload[ClaimTypes.Role] = roles;
        }

        return Results.Json(payload.Where(static kvp => kvp.Value is not null).ToDictionary());
    }
}
