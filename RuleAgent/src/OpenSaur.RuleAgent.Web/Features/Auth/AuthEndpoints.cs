using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OpenSaur.RuleAgent.Web.Features.Auth.Login;
using OpenSaur.RuleAgent.Web.Features.Auth.Logout;

namespace OpenSaur.RuleAgent.Web.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/auth");

        auth.MapGet("/login", (
            HttpContext httpContext,
            string? returnUrl) =>
        {
            var request = new LoginRequest(
                returnUrl,
                httpContext.User.Identity?.IsAuthenticated == true);

            return LoginHandler.Handle(request);
        }).AllowAnonymous();

        auth.MapGet("/logout", (
            HttpContext httpContext,
            string? returnUrl) =>
        {
            var request = new LogoutRequest(
                returnUrl,
                httpContext.User.Identity?.IsAuthenticated == true);

            return LogoutHandler.Handle(request);
        }).AllowAnonymous();

        return app;
    }
}
