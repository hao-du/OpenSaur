using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;

namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/auth/login", (string? returnUrl) =>
            {
                var normalizedReturnUrl = string.IsNullOrWhiteSpace(returnUrl) ? "/" : returnUrl;
                //Redirect backend route to frontend route.
                return Results.Redirect($"/login?returnUrl={Uri.EscapeDataString(normalizedReturnUrl)}");
            })
            .AllowAnonymous();

        app.MapPost("/auth/login", async Task<IResult> (LoginRequest request, LoginHandler loginHandler) =>
            {
                var response = await loginHandler.HandleLoginAsync(request);
                return response.Success ? Results.Ok(response) : Results.BadRequest(response);
            })
            .AllowAnonymous();

        app.MapPost("/auth/logout", async Task<IResult> (LogoutHandler logoutHandler) =>
            {
                await logoutHandler.HandleLogoutAsync();
                return Results.NoContent();
            });

        return app;
    }
}
