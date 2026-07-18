using OpenSaur.CashPilot.Web.Features.Transactions.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Transactions;

public static class TransactionsEndpoints
{
    public static IEndpointRouteBuilder MapTransactionsEndpoints(this IEndpointRouteBuilder app)
    {
        var transactions = app.MapGroup("/api/transactions")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        // Summary / list
        transactions.MapGet("/get", GetTransactionsHandler.HandleAsync);
        transactions.MapGet("/currency-balances", GetCurrencyBalancesHandler.HandleAsync);
        transactions.MapGet("/active-bank-balances", GetActiveBankBalancesHandler.HandleAsync);
        transactions.MapGet("/by-period", GetTransactionsByPeriodHandler.HandleAsync);
        transactions.MapGet("/income-outcome-by-latest-periods", GetIncomeOutcomeByLatestPeriodsHandler.HandleAsync);
        transactions.MapGet("/marker-periods", GetMarkerPeriodsHandler.HandleAsync);
        transactions.MapPost("/auto-tag", AutoTagTransactionHandler.HandleAsync);

        // CashFlow
        transactions.MapGet("/cashflows/getById/{id:guid}", GetCashFlowByIdHandler.HandleAsync);
        transactions.MapPost("/cashflows/create", CreateCashFlowHandler.HandleAsync);
        transactions.MapPut("/cashflows/update", UpdateCashFlowHandler.HandleAsync);
        transactions.MapDelete("/cashflows/delete", DeleteCashFlowHandler.HandleAsync);

        // BankAccount
        transactions.MapGet("/bankaccounts/getById/{id:guid}", GetBankAccountFormByIdHandler.HandleAsync);
        transactions.MapPost("/bankaccounts/create", CreateBankAccountFormHandler.HandleAsync);
        transactions.MapPut("/bankaccounts/update", UpdateBankAccountFormHandler.HandleAsync);
        transactions.MapDelete("/bankaccounts/delete", DeleteBankAccountTransactionHandler.HandleAsync);

        // Transfer
        transactions.MapGet("/transfers/getById/{id:guid}", GetTransferFormByIdHandler.HandleAsync);
        transactions.MapPost("/transfers/create", CreateTransferFormHandler.HandleAsync);
        transactions.MapPut("/transfers/update", UpdateTransferFormHandler.HandleAsync);
        transactions.MapDelete("/transfers/delete", DeleteTransferTransactionHandler.HandleAsync);

        // Exchange
        transactions.MapGet("/exchanges/getById/{id:guid}", GetCurrencyExchangeByIdHandler.HandleAsync);
        transactions.MapPost("/exchanges/create", CreateCurrencyExchangeHandler.HandleAsync);
        transactions.MapPut("/exchanges/update", UpdateCurrencyExchangeHandler.HandleAsync);
        transactions.MapDelete("/exchanges/delete", DeleteCurrencyExchangeHandler.HandleAsync);

        return app;
    }
}
