using OpenSaur.CashPilot.Web.Features.Currencies.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Currencies;

public static class CurrenciesEndpoints
{
    public static IEndpointRouteBuilder MapCurrenciesEndpoints(this IEndpointRouteBuilder app)
    {
        var currencies = app.MapGroup("/api/currencies")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        currencies.MapGet("", GetCurrenciesHandler.HandleAsync);
        currencies.MapGet("/{id:guid}", GetCurrencyByIdHandler.HandleAsync);
        currencies.MapPost("", CreateCurrencyHandler.HandleAsync);
        currencies.MapPut("/{id:guid}", UpdateCurrencyHandler.HandleAsync);
        currencies.MapDelete("/{id:guid}", DeleteCurrencyHandler.HandleAsync);

        return app;
    }
}
