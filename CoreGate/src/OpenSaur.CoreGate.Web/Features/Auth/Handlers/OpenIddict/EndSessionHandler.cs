using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Features.Auth.Services;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class EndSessionHandler(
    IHttpContextAccessor httpContextAccessor,
    CookieService cookieService,
    EndSessionRevocationService endSessionRevocationService)
{
    public async Task<IResult> HandleEndSessionAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        // OpenIddict validates the end-session request before passthrough reaches this handler.
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

        var authenticationResult = await httpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (authenticationResult.Succeeded && authenticationResult.Principal is not null)
        {
            await endSessionRevocationService.RevokeCurrentClientSessionAsync(
                authenticationResult.Principal,
                request.ClientId,
                httpContext.RequestAborted);
        }

        await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        cookieService.ClearRefreshTokenCookie(httpContext.Response);

        if (string.IsNullOrWhiteSpace(request.PostLogoutRedirectUri))
        {
            return Results.Redirect("/login");
        }

        var redirectUri = request.PostLogoutRedirectUri;
        if (!string.IsNullOrWhiteSpace(request.State))
        {
            redirectUri = QueryHelpers.AddQueryString(redirectUri, "state", request.State);
        }

        return Results.Redirect(redirectUri);
    }
}
