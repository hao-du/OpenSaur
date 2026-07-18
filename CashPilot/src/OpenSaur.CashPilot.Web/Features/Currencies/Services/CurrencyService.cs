using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Services;

public sealed class CurrencyService(CashPilotDbContext dbContext)
{
    public async Task<Currency?> GetDefaultCurrencyAsync(Guid ownerId, CancellationToken cancellationToken)
    {
        var currency = await dbContext.Currencies
            .Where(x => x.OwnerId == ownerId && x.IsDefault)
            .FirstOrDefaultAsync(cancellationToken);

        return currency;
    }
}
