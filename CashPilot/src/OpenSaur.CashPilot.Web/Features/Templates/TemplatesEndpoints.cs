using OpenSaur.CashPilot.Web.Features.Templates.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Templates;

public static class TemplatesEndpoints
{
    public static IEndpointRouteBuilder MapTemplatesEndpoints(this IEndpointRouteBuilder app)
    {
        var templates = app.MapGroup("/api/templates")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        templates.MapGet("", GetTemplatesHandler.HandleAsync);
        templates.MapGet("/{id:guid}", GetTemplateByIdHandler.HandleAsync);
        templates.MapPost("", CreateTemplateHandler.HandleAsync);
        templates.MapPut("/{id:guid}", UpdateTemplateHandler.HandleAsync);
        templates.MapDelete("/{id:guid}", DeleteTemplateHandler.HandleAsync);

        return app;
    }
}
