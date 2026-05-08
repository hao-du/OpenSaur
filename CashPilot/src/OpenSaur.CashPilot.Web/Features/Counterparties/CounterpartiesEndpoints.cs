using OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Counterparties;

public static class CounterpartiesEndpoints
{
    public static IEndpointRouteBuilder MapCounterpartiesEndpoints(this IEndpointRouteBuilder app)
    {
        var counterparties = app.MapGroup("/api/counterparties")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        counterparties.MapGet("", GetCounterpartiesHandler.HandleAsync);
        counterparties.MapGet("/{id:guid}", GetCounterpartyByIdHandler.HandleAsync);
        counterparties.MapPost("", CreateCounterpartyHandler.HandleAsync);
        counterparties.MapPut("/{id:guid}", UpdateCounterpartyHandler.HandleAsync);
        counterparties.MapDelete("/{id:guid}", DeleteCounterpartyHandler.HandleAsync);

        return app;
    }
}
