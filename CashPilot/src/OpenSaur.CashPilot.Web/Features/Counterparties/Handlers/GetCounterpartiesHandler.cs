using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;

public static class GetCounterpartiesHandler
{
    public static async Task<Ok<IReadOnlyList<CounterpartyResponse>>> HandleAsync(
        [FromQuery] bool? isActive,
        [FromQuery] string? fullName,
        [FromQuery] string? email,
        [FromQuery] string? phoneNumber,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var normalizedFullName = fullName?.Trim();
        var normalizedEmail = email?.Trim();
        var normalizedPhoneNumber = phoneNumber?.Trim();
        var activeFilter = isActive ?? true;

        var query = dbContext.Counterparties
            .AsNoTracking()
            .Where(counterparty => counterparty.IsActive == activeFilter);

        if (!string.IsNullOrWhiteSpace(normalizedFullName))
        {
            query = query.Where(counterparty => EF.Functions.ILike(counterparty.FullName, $"%{normalizedFullName}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalizedEmail))
        {
            query = query.Where(counterparty => counterparty.Email != null && EF.Functions.ILike(counterparty.Email, $"%{normalizedEmail}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalizedPhoneNumber))
        {
            query = query.Where(counterparty => counterparty.PhoneNumber != null && EF.Functions.ILike(counterparty.PhoneNumber, $"%{normalizedPhoneNumber}%"));
        }

        var result = await query
            .OrderBy(counterparty => counterparty.FullName)
            .Select(counterparty => new CounterpartyResponse(
                counterparty.Id,
                counterparty.FullName,
                counterparty.Email,
                counterparty.PhoneNumber,
                counterparty.Description,
                counterparty.IsActive
            ))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<CounterpartyResponse>>(result);
    }
}
