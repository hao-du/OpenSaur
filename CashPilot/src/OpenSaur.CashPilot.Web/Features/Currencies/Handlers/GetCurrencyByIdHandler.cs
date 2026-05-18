using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

public static class GetCurrencyByIdHandler
{
    public static async Task<Results<Ok<CurrencyResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var result = await dbContext.Currencies
            .AsNoTracking()
            .Where(currency => currency.Id == id && currency.OwnerId == currentUserId)
            .Select(currency => new CurrencyResponse(
                currency.Id,
                currency.Name,
                currency.ShortName,
                currency.Description,
                currency.IsDefault
            ))
            .SingleOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return AppHttpResults.NotFound("Currency not found.", "No currency matched the specified identifier.");
        }

        return TypedResults.Ok(result);
    }
}
