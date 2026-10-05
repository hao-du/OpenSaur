using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;

namespace OpenSaur.Brainbubby.Web.Features.Auth.Login;

public static class LoginHandler
{
    public static IResult Handle(LoginRequest request)
    {
        var targetReturnUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl) && request.ReturnUrl.StartsWith('/')
            ? request.ReturnUrl
            : "/";

        if (request.IsAuthenticated)
        {
            return Results.LocalRedirect(targetReturnUrl);
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = targetReturnUrl
        };

        return Results.Challenge(properties, [AuthConstants.DefaultOidcScheme]);
    }
}
