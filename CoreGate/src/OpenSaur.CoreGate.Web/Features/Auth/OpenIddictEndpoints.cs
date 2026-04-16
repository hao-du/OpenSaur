using Claims = System.Security.Claims;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class OpenIddictEndpoints
{
    public static IEndpointRouteBuilder MapOpenIddictEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapMethods("/connect/authorize", [HttpMethods.Get, HttpMethods.Post], async (AuthorizeHandler authorizeHandler) => await authorizeHandler.HandleAuthorizeAsync())
            .AllowAnonymous();

        app.MapPost("/connect/token", async (TokenHandler tokenHandler) => await tokenHandler.HandleTokenAsync())
            .AllowAnonymous();

        app.MapMethods("/connect/endsession", [HttpMethods.Get, HttpMethods.Post], async (EndSessionHandler endSessionHandler) => await endSessionHandler.HandleEndSessionAsync())
            .AllowAnonymous();

        app.MapGet("/connect/userinfo", async (UserInfoHandler userInfoHandler) => await userInfoHandler.HandleUserInfoAsync())
            .AllowAnonymous();

        return app;
    }
}
