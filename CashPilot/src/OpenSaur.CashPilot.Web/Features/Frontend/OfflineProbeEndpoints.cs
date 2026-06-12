namespace OpenSaur.CashPilot.Web.Features.Frontend;

public static class OfflineProbeEndpoints
{
    public static IEndpointRouteBuilder MapOfflineProbeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapMethods("/api/offline-probe", ["HEAD"], () => Results.NoContent())
            .AllowAnonymous();

        return app;
    }
}
