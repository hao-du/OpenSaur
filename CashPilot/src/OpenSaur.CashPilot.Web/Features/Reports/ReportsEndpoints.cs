using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Features.Reports.Dtos;
using OpenSaur.CashPilot.Web.Features.Reports.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Reports;

public static class ReportsEndpoints
{
    public static IEndpointRouteBuilder MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var reports = app.MapGroup("/api/reports")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        reports.MapGet("/income-outcome", GetIncomeOutcomeHandler.HandleAsync);

        return app;
    }
}
