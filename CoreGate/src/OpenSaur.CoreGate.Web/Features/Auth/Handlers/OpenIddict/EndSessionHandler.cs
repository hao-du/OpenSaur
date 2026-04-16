using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using OpenIddict.Server.AspNetCore;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class EndSessionHandler(IHttpContextAccessor httpContextAccessor)
{
    public async Task<IResult> HandleEndSessionAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        // OpenIddict validates the end-session request before passthrough reaches this handler.
        var request = httpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request could not be resolved.");

        await httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

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
