using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;

namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/auth/login", async Task<IResult> (LoginRequest request, LoginHandler loginHandler) =>
            {
                var response = await loginHandler.HandleLoginAsync(request);
                return response.Success ? Results.Ok(response) : Results.BadRequest(response);
            })
            .AllowAnonymous();

        app.MapPost("/auth/exchange", async Task<IResult> (TokenExchangeRequest request, ExchangeTokenHandler exchangeTokenHandler) =>
            {
                return await exchangeTokenHandler.HandleExchangeAsync(request);
            })
            .AllowAnonymous();

        app.MapPost("/auth/refresh", async Task<IResult> (TokenRefreshRequest request, RefreshTokenHandler refreshTokenHandler) =>
            {
                return await refreshTokenHandler.HandleRefreshAsync(request);
            })
            .AllowAnonymous();

        app.MapGet("/auth/change-password/access", async Task<IResult> (ChangePasswordAccessHandler changePasswordAccessHandler) =>
            {
                return await changePasswordAccessHandler.HandleAccessChangePasswordAsync()
                    ? Results.NoContent()
                    : Results.Forbid();
            });

        app.MapPost("/auth/change-password", async Task<IResult> (ChangePasswordRequest request, ChangePasswordHandler changePasswordHandler) =>
            {
                var response = await changePasswordHandler.HandleChangePasswordAsync(request);
                if (response.Success)
                {
                    return Results.Ok(response);
                }

                return response.Forbidden
                    ? Results.Json(response, statusCode: StatusCodes.Status403Forbidden)
                    : Results.BadRequest(response);
            });

        return app;
    }
}
