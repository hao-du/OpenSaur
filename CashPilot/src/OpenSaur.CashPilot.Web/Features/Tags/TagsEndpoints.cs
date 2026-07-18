using OpenSaur.CashPilot.Web.Features.Tags.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Tags;

public static class TagsEndpoints
{
    public static IEndpointRouteBuilder MapTagsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tags")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        group.MapGet("", GetTagsHandler.HandleAsync);
        group.MapGet("/marker-tags", GetMarkerTagsHandler.HandleAsync);
        group.MapPost("", CreateTagHandler.HandleAsync);
        group.MapPut("/{id:guid}", UpdateTagHandler.HandleAsync);
        group.MapDelete("/{id:guid}", DeleteTagHandler.HandleAsync);

        return app;
    }
}
