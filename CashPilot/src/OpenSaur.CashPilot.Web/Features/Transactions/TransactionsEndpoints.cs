using OpenSaur.CashPilot.Web.Features.Transactions.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Transactions;

public static class TransactionsEndpoints
{
    public static IEndpointRouteBuilder MapTransactionsEndpoints(this IEndpointRouteBuilder app)
    {
        var transactions = app.MapGroup("/api/transactions")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        transactions.MapGet("", GetTransactionsHandler.HandleAsync);
        transactions.MapGet("/cashflows/{id:guid}", GetCashFlowByIdHandler.HandleAsync);
        transactions.MapPost("/cashflows", CreateCashFlowHandler.HandleAsync);
        transactions.MapPut("/cashflows/{id:guid}", UpdateCashFlowHandler.HandleAsync);
        transactions.MapDelete("/cashflows/{id:guid}", DeleteCashFlowHandler.HandleAsync);

        return app;
    }
}
