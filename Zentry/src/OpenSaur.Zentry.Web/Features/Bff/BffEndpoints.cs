using Microsoft.AspNetCore.Http;
using OpenSaur.Zentry.Web.Features.Bff.Login;
using OpenSaur.Zentry.Web.Features.Bff.Logout;

namespace OpenSaur.Zentry.Web.Features.Bff;

public static class BffEndpoints
{
    public static IEndpointRouteBuilder MapBffEndpoints(this IEndpointRouteBuilder app)
    {
        var bff = app.MapGroup("/bff");

        bff.MapGet("/login", (
            HttpContext httpContext,
            string? returnUrl,
            string? impersonatedUserId,
            string? workspaceId) =>
        {
            var request = new LoginRequest(
                returnUrl,
                impersonatedUserId,
                workspaceId,
                httpContext.User.Identity?.IsAuthenticated == true);

            return LoginHandler.Handle(request);
        }).AllowAnonymous();

        bff.MapGet("/logout", (
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
