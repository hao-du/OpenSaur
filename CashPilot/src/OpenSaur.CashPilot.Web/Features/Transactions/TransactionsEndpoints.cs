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
        transactions.MapGet("/dashboard", GetTransactionDashboardHandler.HandleAsync);
        transactions.MapPost("/cashflows", CreateCashFlowHandler.HandleAsync);
        transactions.MapPost("/bankaccounts", CreateBankAccountHandler.HandleAsync);
        transactions.MapPost("/bankaccounts/transactions", AddBankAccountTransactionHandler.HandleAsync);
        transactions.MapPost("/transfers", CreateTransferHandler.HandleAsync);
        transactions.MapPost("/transfers/transactions", AddTransferTransactionHandler.HandleAsync);
        transactions.MapPost("/exchanges", CreateCurrencyExchangeHandler.HandleAsync);

        return app;
    }
}
