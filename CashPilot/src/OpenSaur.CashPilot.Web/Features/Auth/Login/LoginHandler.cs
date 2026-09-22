using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;

namespace OpenSaur.CashPilot.Web.Features.Auth.Login;

public static class LoginHandler
{
    public static IResult Handle(LoginRequest request)
    {
        var targetReturnUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl) && UriHelper.IsLocalUrl(request.ReturnUrl)
            ? request.ReturnUrl
            : "/";

        if (request.IsAuthenticated)
        {
            return TypedResults.LocalRedirect(targetReturnUrl);
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = targetReturnUrl
        };

        return TypedResults.Challenge(properties, [AuthConstants.DefaultOidcScheme]);
    }
}

