using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace OpenSaur.Identity.Web.Features.Auth.Logout;

public static class LogoutHandler
{
    public static async Task<IResult> HandleAsync(HttpContext httpContext)
    {
        await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

        return Results.NoContent();
    }
}
