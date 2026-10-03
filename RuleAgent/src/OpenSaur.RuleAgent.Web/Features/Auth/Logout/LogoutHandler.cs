using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;

namespace OpenSaur.RuleAgent.Web.Features.Auth.Logout;

public static class LogoutHandler
{
    public static IResult Handle(LogoutRequest request)
    {
        var targetReturnUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl) && request.ReturnUrl.StartsWith('/')
            ? request.ReturnUrl
            : "/";

        if (!request.IsAuthenticated)
        {
            return Results.LocalRedirect(targetReturnUrl);
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = targetReturnUrl
        };

        return Results.SignOut(
            properties,
            [AuthConstants.DefaultCookieScheme, AuthConstants.DefaultOidcScheme]);
    }
}
