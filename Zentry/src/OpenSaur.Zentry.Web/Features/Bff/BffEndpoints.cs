using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Features.Bff.ChangePassword;
using OpenSaur.Zentry.Web.Features.Bff.Login;
using OpenSaur.Zentry.Web.Features.Bff.Logout;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;

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

        bff.MapGet("/change-password", (
            HttpContext httpContext,
            IOptions<OidcOptions> oidcOptions,
            string? returnUrl) =>
        {
            var defaultReturnUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}/";
            var request = new ChangePasswordRequest(returnUrl, defaultReturnUrl);
            return ChangePasswordHandler.Handle(request, oidcOptions);
        }).RequireAuthorization();

        return app;
    }
}
