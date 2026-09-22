using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;

namespace OpenSaur.CashPilot.Web.Features.Auth.Logout;

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

        return TypedResults.SignOut(
            properties,
            [AuthConstants.DefaultCookieScheme, AuthConstants.DefaultOidcScheme]);
    }
}

