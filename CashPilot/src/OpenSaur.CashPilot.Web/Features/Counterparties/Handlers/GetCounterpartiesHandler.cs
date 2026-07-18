using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;

public static class GetCounterpartiesHandler
{
    public static async Task<Ok<IReadOnlyList<CounterpartyResponse>>> HandleAsync(
        [FromQuery] bool? isActive,
        [FromQuery] string? fullName,
        [FromQuery] string? email,
        [FromQuery] string? phoneNumber,
        ClaimsPrincipal user,
        IHybridCacheService cache,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.CounterpartiesKey(currentUserId);

        var result = await cache.GetOrCreateAsync(
            cacheKey,
            async (key) =>
            {
                var normalizedFullName = fullName?.Trim();
                var normalizedEmail = email?.Trim();
                var normalizedPhoneNumber = phoneNumber?.Trim();
                var activeFilter = isActive ?? true;

                var query = dbContext.Counterparties
                    .AsNoTracking()
                    .Where(counterparty => counterparty.OwnerId == currentUserId && counterparty.IsActive == activeFilter);

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

                return await query
                    .OrderByDescending(counterparty => counterparty.IsDefault)
                    .ThenBy(counterparty => counterparty.FullName)
                    .Select(counterparty => new CounterpartyResponse(
                        counterparty.Id,
                        counterparty.FullName,
                        counterparty.Email,
                        counterparty.PhoneNumber,
                        counterparty.Description,
                        counterparty.IsDefault,
                        counterparty.IsActive
                    ))
                    .ToListAsync(cancellationToken);
            },
            CacheConstants.DefaultTtl);

        return TypedResults.Ok<IReadOnlyList<CounterpartyResponse>>(result);
    }
}
