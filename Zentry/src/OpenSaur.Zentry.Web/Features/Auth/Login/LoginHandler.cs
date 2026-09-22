using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.Zentry.Web.Features.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.Auth.Login;

public static class LoginHandler
{
    public static IResult Handle(LoginRequest request)
    {
        var targetReturnUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl) && UriHelper.IsLocalUrl(request.ReturnUrl)
            ? request.ReturnUrl
            : "/";

        var isSwitchingContext = !string.IsNullOrWhiteSpace(request.ImpersonatedUserId)
            || !string.IsNullOrWhiteSpace(request.WorkspaceId);

        // If user already has a valid session cookie and is not requesting impersonation, redirect directly
        if (request.IsAuthenticated && !isSwitchingContext)
        {
            return TypedResults.LocalRedirect(targetReturnUrl);
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = targetReturnUrl
        };

        if (!string.IsNullOrWhiteSpace(request.ImpersonatedUserId))
        {
            properties.Items[CoreGateClaimTypes.ImpersonatedUserId] = request.ImpersonatedUserId;
        }

        if (!string.IsNullOrWhiteSpace(request.WorkspaceId))
        {
            properties.Items[CoreGateClaimTypes.WorkspaceId] = request.WorkspaceId;
        }

        return TypedResults.Challenge(properties, [AuthConstants.DefaultOidcScheme]);
    }
}

