namespace OpenSaur.Zentry.Web.Features.Profile;

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var profile = app.MapGroup("/api/profile")
            .RequireAuthorization();

        profile.MapGet("/current", CurrentProfileHandler.HandleAsync);
        profile.MapPut("/require-password-change", RequirePasswordChangeHandler.HandleAsync);

        return app;
    }
}
