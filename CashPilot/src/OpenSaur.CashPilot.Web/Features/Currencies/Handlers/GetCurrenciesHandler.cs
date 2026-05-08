using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

public static class GetCurrenciesHandler
{
    public static async Task<Ok<IReadOnlyList<CurrencyResponse>>> HandleAsync(
        [FromQuery] bool? isActive,
        [FromQuery] string? name,
        [FromQuery] string? shortName,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var normalizedName = name?.Trim();
        var normalizedShortName = shortName?.Trim();
        var activeFilter = isActive ?? true;

        var query = dbContext.Currencies
            .AsNoTracking()
            .Where(currency => currency.IsActive == activeFilter);

        if (!string.IsNullOrWhiteSpace(normalizedName))
        {
            query = query.Where(currency => EF.Functions.ILike(currency.Name, $"%{normalizedName}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalizedShortName))
        {
            query = query.Where(currency => EF.Functions.ILike(currency.ShortName, $"%{normalizedShortName}%"));
        }

        var result = await query
            .OrderByDescending(currency => currency.IsDefault)
            .ThenBy(currency => currency.ShortName)
            .Select(currency => new CurrencyResponse(
                currency.Id,
                currency.Name,
                currency.ShortName,
                currency.Description,
                currency.IsDefault
            ))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<CurrencyResponse>>(result);
    }
}
