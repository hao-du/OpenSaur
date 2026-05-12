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
        transactions.MapGet("/bankaccounts", GetBankAccountsHandler.HandleAsync);
        transactions.MapGet("/bankaccounts/{id:guid}/form", GetBankAccountFormByIdHandler.HandleAsync);
        transactions.MapGet("/transfers", GetTransfersHandler.HandleAsync);
        transactions.MapGet("/cashflows/{id:guid}", GetCashFlowByIdHandler.HandleAsync);
        transactions.MapGet("/bankaccounts/transactions/{id:guid}", GetBankAccountTransactionByIdHandler.HandleAsync);
        transactions.MapGet("/transfers/transactions/{id:guid}", GetTransferTransactionByIdHandler.HandleAsync);
        transactions.MapGet("/exchanges/{id:guid}", GetCurrencyExchangeByIdHandler.HandleAsync);
        transactions.MapPost("/cashflows", CreateCashFlowHandler.HandleAsync);
        transactions.MapPost("/bankaccounts", CreateBankAccountHandler.HandleAsync);
        transactions.MapPost("/bankaccounts/save", SaveBankAccountFormHandler.HandleAsync);
        transactions.MapPost("/bankaccounts/transactions", AddBankAccountTransactionHandler.HandleAsync);
        transactions.MapPost("/transfers", CreateTransferHandler.HandleAsync);
        transactions.MapPost("/transfers/transactions", AddTransferTransactionHandler.HandleAsync);
        transactions.MapPost("/exchanges", CreateCurrencyExchangeHandler.HandleAsync);
        transactions.MapPut("/cashflows/{id:guid}", UpdateCashFlowHandler.HandleAsync);
        transactions.MapPut("/bankaccounts/{id:guid}", UpdateBankAccountHandler.HandleAsync);
        transactions.MapPut("/bankaccounts/transactions/{id:guid}", UpdateBankAccountTransactionHandler.HandleAsync);
        transactions.MapPut("/transfers/{id:guid}", UpdateTransferHandler.HandleAsync);
        transactions.MapPut("/transfers/transactions/{id:guid}", UpdateTransferTransactionHandler.HandleAsync);
        transactions.MapPut("/exchanges/{id:guid}", UpdateCurrencyExchangeHandler.HandleAsync);
        transactions.MapDelete("/cashflows/{id:guid}", DeleteCashFlowHandler.HandleAsync);
        transactions.MapDelete("/bankaccounts/{id:guid}", DeleteBankAccountHandler.HandleAsync);
        transactions.MapDelete("/bankaccounts/transactions/{id:guid}", DeleteBankAccountTransactionHandler.HandleAsync);
        transactions.MapDelete("/transfers/{id:guid}", DeleteTransferHandler.HandleAsync);
        transactions.MapDelete("/transfers/transactions/{id:guid}", DeleteTransferTransactionHandler.HandleAsync);
        transactions.MapDelete("/exchanges/{id:guid}", DeleteCurrencyExchangeHandler.HandleAsync);

        return app;
    }
}
