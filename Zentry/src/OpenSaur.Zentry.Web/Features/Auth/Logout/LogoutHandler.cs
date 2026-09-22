using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.Zentry.Web.Features.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.Auth.Logout;

public static class LogoutHandler
{
    public static IResult Handle(LogoutRequest request)
    {
        var targetReturnUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl) && UriHelper.IsLocalUrl(request.ReturnUrl)
            ? request.ReturnUrl
            : "/";

        if (!request.IsAuthenticated)
        {
            return TypedResults.LocalRedirect(targetReturnUrl);
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = targetReturnUrl
        };

        // Signs out of both local session cookie and remote OIDC provider (CoreGate /connect/endsession)
        return TypedResults.SignOut(
            properties,
            [AuthConstants.DefaultCookieScheme, AuthConstants.DefaultOidcScheme]);
    }
}

