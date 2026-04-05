using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Auth.Logout;

public static class LogoutHandler
{
    public static async Task<IResult> HandleAsync(HttpContext httpContext)
    {
        await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        httpContext.DeleteFirstPartyRefreshToken();

        return Result.Success().ToApiResult();
    }
}
