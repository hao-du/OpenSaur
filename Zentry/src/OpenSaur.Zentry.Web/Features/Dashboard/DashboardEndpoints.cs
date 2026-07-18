using OpenSaur.Zentry.Web.Features.Dashboard.GetDashboardSummary;

namespace OpenSaur.Zentry.Web.Features.Dashboard;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var dashboard = app.MapGroup("/api/dashboard")
            .RequireAuthorization();

        dashboard.MapGet("/summary", GetDashboardSummaryHandler.HandleAsync);

        return app;
    }
}
