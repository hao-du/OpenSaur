using System.Security.Claims;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth.Me;

public static class GetCurrentUserHandler
{
    public static IResult Handle(ClaimsPrincipal user)
    {
        return Results.Ok(
            new AuthMeResponse(
                AuthPrincipalReader.GetUserId(user),
                user.Identity?.Name,
                user.FindAll(ApplicationClaimTypes.Role).Select(static claim => claim.Value).ToArray(),
                AuthPrincipalReader.GetRequirePasswordChange(user)));
    }
}
