using OpenSaur.CashPilot.Web.Features.PendingTransactions.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.PendingTransactions;

public static class PendingTransactionsEndpoints
{
    public static IEndpointRouteBuilder MapPendingTransactionsEndpoints(this IEndpointRouteBuilder app)
    {
        var pendingTransactions = app.MapGroup("/api/pending-transactions")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        pendingTransactions.MapGet("/get", GetPendingTransactionsHandler.HandleAsync);
        pendingTransactions.MapPost("/submit", SubmitPendingTransactionsHandler.HandleAsync);
        pendingTransactions.MapPut("/update/{id:guid}", UpdatePendingTransactionHandler.HandleAsync);
        pendingTransactions.MapDelete("/delete/{id:guid}", DeletePendingTransactionHandler.HandleAsync);
        pendingTransactions.MapPost("/sync", SyncPendingTransactionsHandler.HandleAsync);

        return app;
    }
}
