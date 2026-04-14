namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/auth/login", (string? returnUrl) =>
            {
                var normalizedReturnUrl = string.IsNullOrWhiteSpace(returnUrl) ? "/" : returnUrl;
                return Results.Redirect($"/login?returnUrl={Uri.EscapeDataString(normalizedReturnUrl)}");
            })
            .AllowAnonymous();

        app.MapPost("/auth/login", async Task<IResult> (LoginRequest request, AuthService authService, HttpContext httpContext) =>
            {
                var response = await authService.LoginAsync(httpContext, request);
                return response.Success ? Results.Ok(response) : Results.BadRequest(response);
            })
            .AllowAnonymous();

        app.MapPost("/auth/logout", async Task<IResult> (AuthService authService, HttpContext httpContext) =>
            {
                await authService.LogoutAsync(httpContext);
                return Results.NoContent();
            });

        return app;
    }
}
