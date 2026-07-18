using OpenSaur.CashPilot.Web.Features.Banks.Handlers;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;

namespace OpenSaur.CashPilot.Web.Features.Banks;

public static class BanksEndpoints
{
    public static IEndpointRouteBuilder MapBanksEndpoints(this IEndpointRouteBuilder app)
    {
        var banks = app.MapGroup("/api/banks")
            .RequireAuthorization(AppAuthorization.CanAccessPolicyName);

        banks.MapGet("", GetBanksHandler.HandleAsync);
        banks.MapGet("/{id:guid}", GetBankByIdHandler.HandleAsync);
        banks.MapPost("", CreateBankHandler.HandleAsync);
        banks.MapPut("/{id:guid}", UpdateBankHandler.HandleAsync);
        banks.MapDelete("/{id:guid}", DeleteBankHandler.HandleAsync);

        return app;
    }
}
